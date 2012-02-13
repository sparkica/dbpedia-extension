/*

Copyright 2010, Google Inc.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are
met:

    * Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above
copyright notice, this list of conditions and the following disclaimer
in the documentation and/or other materials provided with the
distribution.
    * Neither the name of Google Inc. nor the names of its
contributors may be used to endorse or promote products derived from
this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
"AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,           
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY           
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

var ZemantaExtension = {handlers: {}, util: {}};

ZemantaExtension.handlers.doNothing = function() {
	alert("Zemanta extension active...");
};


ZemantaExtension.util.getReconId = function(column, visibleRows) {
	var rows = theProject.rowModel.rows;
    var row = null;
    var cell = null;
    var reconFound = false;
    var reconId = null;
    var o = visibleRows;
  
    //check if any of visible cells contain reconciliation information
    for (var i = 0; (i < o.rowIndices.length) && !reconFound; i++) {
    	row = rows[o.rowIndices[i]];
    	cell = row.cells[column.cellIndex];
    	if(cell!=null && cell.r != null){   
	    	if(cell.r && (typeof(cell.r.m) !== 'undefined') ) {
	    		reconId = cell.r.m.id;
	    		reconFound = true;
	    	}
    	}
    }    
    return reconId;
};


ExtensionBar.addExtensionMenu({
"id": "zemanta",
"label": "Zemanta",
"submenu": [
	 {
	 "id": "zemanta/test",
	 label: "Do test",
	 click: function() {ZemantaExtension.handlers.doNothing(); }
	 }
	]
 });
  
  // faster way to get properties - not using column.reconConfig  
  // Zemanta recon api doesn't return types anyway  
  // check sampled visible rows for reconciliation match id
  // pass first found if as a type in the dialog

 DataTableColumnHeaderUI.extendMenu(function(column, columnHeaderUI, menu) {
  var columnIndex = Refine.columnNameToColumnIndex(column.name);
  var doAddColumnFromDBpedia = function() {
  var o = DataTableView.sampleVisibleRows(column);
  var reconId = ZemantaExtension.util.getReconId(column, o);
  var isDBpedia = false;

  if(reconId !== null) {
	  isDBpedia = (reconId.indexOf("dbpedia.org") != -1);
  }
  
  if(reconId === null || !isDBpedia) {
	  alert("Adding columns from DBpedia requires DBpedia-reconciled values in selected column.");
  }


  new ZemantaExtendDataPreviewDialog(
      column, 
      columnIndex, 
      reconId,
      o.rowIndices, 
      function(extension) {
        Refine.postProcess(
            "dbpedia-extension",
            "extend-data", 
            {
              baseColumnName: column.name,
              columnInsertIndex: columnIndex + 1
            },
            {
              extension: JSON.stringify(extension)
            },
            { rowsChanged: true, modelsChanged: true }
        );
      }
    );
  };

  MenuSystem.insertAfter(
    menu,
    [ "core/edit-column", "core/add-column-by-fetching-urls" ],
    {
      id: "zemanta/add-columns-from-dbpedia",
      label: "Add columns from DBpedia ...",
      click: doAddColumnFromDBpedia
    }
  );
});
