"use strict";

define(['logManager',
    'clientUtil',
    'text!js/DataGrid/DataGridViewTemplate.html',
    'text!js/DataGrid/DataTableTemplate.html',
    'css!DataGridCSS/DataGridView.css'], function (logManager,
                                                          util,
                                                          dataGridViewTemplate,
                                                          dataTableTemplate) {

    var DataGridView,
        DEFAULT_DATAMEMBER_ID = "ID",
        DEFAULT_NON_EXISTING_VALUE = '__undefined__',
        UNDEFINED_VALUE_CLASS = "undefined-value";

    DataGridView = function (options) {
        //set properties from options
        this.containerElementId = typeof options === "string" ? options : options.containerElement;
        this.logger = options.logger || logManager.create((options.loggerName || "DataGridView") + '_' + this.containerElementId);

        this._readOnlyMode = options.readOnlyMode || true;
        this.logger.warning("DataGridView.ctor _readOnlyMode is set to TRUE by default");

        //initialize UI
        this.initializeUI();

        this._groupColumns = true;

        this.clear();

        this.logger.debug("DesignerCanvas ctor finished");
    };

    DataGridView.prototype.initializeUI = function () {
        //get container first
        this.$el = $("#" + this.containerElementId);
        if (this.$el.length === 0) {
            this.logger.warning("DataGridView's container control with id:'" + this.containerElementId + "' could not be found");
            throw "DataGridView's container control with id:'" + this.containerElementId + "' could not be found";
        }
        
        this.$el.append(this.$_DOMBase);
    };

    DataGridView.prototype.$_DOMBase = $(dataGridViewTemplate);

    DataGridView.prototype.$_dataTableBase = $(dataTableTemplate);

    DataGridView.prototype.clear = function () {
        this.dataMemberID = DEFAULT_DATAMEMBER_ID;
        this._columns = [];
        this._dataMap = {};

        if (this._oTable) {
            this._oTable.fnClearTable();
            this._oTable.fnDestroy(false);
        }

        if (this.$table) {
            this.$table.remove();
            this.$table = undefined;
        }
    };

    DataGridView.prototype.destroy = function () {
        this.clear();
    };

    DataGridView.prototype._initializeTable = function (columns) {
        var self = this;

        this.$table = this.$_dataTableBase.clone();
        this.$el.append(this.$table);

        //if column grouping is needed, we need to manually build the table's header
        //DataTable can not generate the grouped header but can use it
        if (this._groupColumns === true) {
            this._buildGroupedHeader(columns);
        }

        this._oTable = this.$table.dataTable( {
             "bPaginate": false,
             "bLengthChange": false,
             "bFilter": true,
             "bAutoWidth": false,
             "bDestroy": true,
             "bRetrieve": false,
                "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
                    self._fnRowCallback(nRow, aData, iDisplayIndex, iDisplayIndexFull);
                },
            "aoColumns": columns.slice(0)});
    };

    DataGridView.prototype._buildGroupedHeader = function (columns) {
        var len = columns.length,
            layout = [[]],
            i,
            buildLayout,
            processLayout,
            generateHeader,
            tHead = this.$table.find("> thead");

        buildLayout = function (level, col) {
            var cName = col.sTitle,
                layoutRow = layout[level],
                len = layoutRow.length,
                inserted = false,
                groupCol = cName.indexOf('.') !== -1,
                sName,
                rName,
                cCol;

            if (groupCol === true) {
                sName = cName.split('.')[0];
                rName = cName.substring(cName.indexOf('.') + 1 );
                while (len--) {
                    cCol = layoutRow[len];
                    if (cCol.sName === sName) {
                        cCol.colspan += 1;
                        cCol.subCols.push(rName);
                        inserted = true;
                        break;
                    }
                }

                if (inserted === false) {
                    layoutRow.push({"sName": sName,
                        "rowspan": 1,
                        "colspan": 1,
                        "subCols": [rName]});
                }
            } else {
                layoutRow.push({"sName": cName,
                             "rowspan": 1,
                             "colspan": 1,
                             "subCols": []});
            }
        };

        processLayout = function (level) {
            var layoutRow = layout[level],
                len = layoutRow.length,
                subColLen,
                cCol,
                i,
                j;

            //insert a next row, we might need it
            layout.push([]);

            for (i = 0; i < len; i += 1) {
                cCol = layoutRow[i];
                subColLen = cCol.subCols.length;
                for (j = 0; j <  subColLen; j += 1) {
                    buildLayout(level + 1, {"sTitle": cCol.subCols[j] });
                }
            }

            if (layout[level + 1].length > 0) {
                //increase rowspan value in the rows 'current and up'
                for (j = 0; j <= level; j+= 1) {
                    len = layout[j].length;
                    for (i = 0; i < len; i += 1) {
                        //if it has exactly 1 subelement, no neet to rowspan
                        if (layout[j][i].subCols.length !== 1) {
                            layout[j][i].rowspan += 1;
                        }
                    }
                }

                processLayout(level + 1);
            }
        };

        generateHeader = function () {
            var row = layout[0],
                len = row.length,
                i,
                rowHtml = '',
                cellHtml,
                rowSpan,
                colSpan;

            for (i = 0; i < len ; i += 1) {
                colSpan = row[i].colspan;
                rowSpan = colSpan === 1 ? row[i].rowspan : 1;
                cellHtml = '<th rowspan="' + rowSpan + '" colspan="' + colSpan + '">' + row[i].sName + '</th>';
                rowHtml += cellHtml;
            }

            if (rowHtml !== '') {
                tHead.append($( '<tr>' + rowHtml + '</tr>'));
            }

            layout.splice(0, 1);
            if (layout.length > 0) {
                generateHeader();
            }
        };

        for (i = 0; i <  len; i++) {
            buildLayout(0, columns[i]);
            if (columns[i].sTitle.indexOf('.') !== 1) {
                columns[i].sTitle = columns[i].sTitle.substring(columns[i].sTitle.lastIndexOf('.') + 1);
            }
        }
        processLayout(0);

        generateHeader();
    };

    DataGridView.prototype.beginUpdate = function () {

    };

    DataGridView.prototype.endUpdate = function () {

    };

    DataGridView.prototype.insertObjects = function (objects) {
        var result,
            len,
            rowIdx,
            key;

        if (objects.length > 0) {
            //check if the columns are defined already
            //if so, just load the data
            if (this._columns.length === 0) {
                this._autoDetectColumns(objects);
            }

            result = this._oTable.fnAddData(objects);
            if (this.dataMemberID) {
                len = result.length;
                while (len--) {
                    rowIdx = result[len];
                    key = this._getDataMemberID(objects[len]);
                    this._dataMap[key] = rowIdx;
                }
            }
        }
    };

    DataGridView.prototype.updateObjects = function (objects) {
        var len = objects.length,
            key;

        if (len > 0) {
            //TODO: check if there are additional columns appearing!!!
            if (this.dataMemberID) {
                while (len--) {
                    key = this._getDataMemberID(objects[len]);
                    if (this._dataMap.hasOwnProperty(key)) {
                        if( 1 === this._oTable.fnUpdate( objects[len], this._dataMap[key]) ) {
                            this.logger.warning("Updating object with dataMemberID '" + key + "' was unsuccessful");
                        }
                    } else {
                        this.logger.warning("Can not update object with dataMemberID '" + key + "'. Object with this ID is not present in grid...");
                    }
                }
            } else {
                this.logger.warning("Cannot update grid since dataMemberID is not set. Can not match elements...");
            }
        }
    };

    DataGridView.prototype.deleteObjects = function (objectIDs) {
        var len = objectIDs.length,
            key,
            rowIdx,
            i;

        if (len > 0) {
            if (this.dataMemberID) {
                while (len--) {
                    key = objectIDs[len];
                    if (this._dataMap.hasOwnProperty(key)) {
                        rowIdx = this._dataMap[key];
                        this._oTable.fnDeleteRow(rowIdx);
                        delete this._dataMap[key];

                        //fix indexes
                        for (i in this._dataMap) {
                            if (this._dataMap.hasOwnProperty(i)) {
                                if (this._dataMap[i] > rowIdx) {
                                    this._dataMap[i] -= 1;
                                }
                            }
                        }
                    } else {
                        this.logger.warning("Can not delete object with dataMemberID '" + key + "'. Object with this dataMemberID is not present in grid...");
                    }
                }
            } else {
                this.logger.warning("Cannot delete objects from grid since dataMemberID is not set. Can not match elements...");
            }
        }
    };

    DataGridView.prototype._autoDetectColumns = function (objects) {
        var len = objects.length,
            columns = {},
            columnNames = [],
            flattenedObj,
            prop,
            n,
            i;

        while (len--) {
            flattenedObj = util.flattenObject( objects[len]);

            for (prop in flattenedObj) {
               if (flattenedObj.hasOwnProperty(prop)) {
                   if (columnNames.indexOf(prop) === -1) {
                       columnNames.push(prop);

                       columns[prop] = {"title": prop,
                                        "data": prop};
                   }
               }
            }
        }

        columnNames = columnNames.sort();
        len = columnNames.length;
        
        //if dataMemberID is set and is present in the columns
        //let it be the first column
        if (this.dataMemberID && this.dataMemberID !== "") {
            if (columnNames.indexOf(this.dataMemberID) !== -1) {
                this._addColumnDef(this.dataMemberID, this.dataMemberID);
            }
        }

        for (i = 0; i < len; i += 1) {
            n = columnNames[i];
            if (this.dataMemberID !== n) {
                this._addColumnDef(columns[n].title, columns[n].data);
            }
        }

        this._initializeTable(this._columns);
    };

    DataGridView.prototype._addColumnDef = function (title, data) {
        var self = this;

        this._columns.push({"sTitle": title,
            "mData": data,
            "mRender": function ( data , type, full ) {
                return self._mRender( data , type, full );
            },
            "sDefaultContent" : DEFAULT_NON_EXISTING_VALUE
           });
    };

    DataGridView.prototype._mRender = function ( data , type, full ) {
        if (data === DEFAULT_NON_EXISTING_VALUE ) {
            return '';
        }

        if (_.isArray(data) && type === 'display') {
            return data.join('<br/>');
        }

        return data;
    };

    DataGridView.prototype._fnRowCallback = function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
        var len = nRow.cells.length,
            d,
            $td;

        while (len--) {
            d = this._oTable.fnSettings().aoColumns[len].fnGetData(aData);
            $td = $(nRow.cells[len]);
            if (d === DEFAULT_NON_EXISTING_VALUE) {
                $td.addClass(UNDEFINED_VALUE_CLASS);
            } else {
                $td.removeClass(UNDEFINED_VALUE_CLASS);
            }
        }
    };

    DataGridView.prototype._getDataMemberID = function (dataObject) {
        return this._fetchData(dataObject, this.dataMemberID);
    };

    DataGridView.prototype._fetchData = function (object, data) {
        var a = data.split('.'),
            k = a[0];

        if (a.length > 1 ) {
            a.splice(0,1);

            return this._fetchData(object[k], a.join('.'));
        } else {
            return object[k];
        }
    };

    return DataGridView;
});