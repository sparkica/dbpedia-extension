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
//importPackage(com.google.refine.com.zemanta.commands);

var html = "text/html";
var encoding = "UTF-8";
var ClientSideResourceManager = Packages.com.google.refine.ClientSideResourceManager;
var RS = Packages.com.google.refine.RefineServlet;
var OR = Packages.com.google.refine.operations.OperationRegistry;
var RC = Packages.com.google.refine.model.recon.ReconConfig;




/*
 * Function invoked to initialize the extension.
 */
function init() {
  // Packages.java.lang.System.err.println(module.getMountPoint());
  Packages.java.lang.System.err.println("Initializing Zemanta extension....");

  registerCommands();
  registerOperations();    
  registerReconciliationConfiguration();
  
  // Script files to inject into /project page
  ClientSideResourceManager.addPaths(
    "project/scripts",
    module,
    [
      "scripts/extension.js",    
      "scripts/util/zemanta.js",
      "scripts/dialogs/extend-data-preview-dialog.js"

    ]
  );

  // Style files to inject into /project page
  ClientSideResourceManager.addPaths(
    "project/styles",
    module,
    [
      "styles/project-injection.less"
    ]
  );
}

function registerCommands() {
  // register our classes  
  
  RS.registerClassMapping(
  "com.google.refine.model.changes.DataExtensionChange",
  "com.google.refine.com.zemanta.model.changes.DataExtensionChange");
  
  //temp hack needed for the core modul
  //to resolve this modul's classes
  RS.cacheClass(Packages.com.google.refine.com.zemanta.model.changes.DataExtensionChange);

  RS.registerCommand(module, "extend-data", new Packages.com.google.refine.com.zemanta.commands.ExtendDataCommand());
  RS.registerCommand(module, "preview-extend-data",   new Packages.com.google.refine.com.zemanta.commands.PreviewExtendDataCommand());
  


}


function registerOperations() {
  OR.registerOperation(module, "extend-data",Packages.com.google.refine.com.zemanta.operations.ExtendDataOperation);
}

function registerReconciliationConfiguration() {
 // not yet needed but it will be soon

  RC.registerReconConfig(module, "strict", Packages.com.google.refine.com.zemanta.model.recon.StrictReconConfig);
  RC.registerReconConfig(module, "extend", Packages.com.google.refine.com.zemanta.model.recon.DataExtensionReconConfig);

}


/*
 * Function invoked to handle each request in a custom way.
 */
function process(path, request, response) {
  // Analyze path and handle this request yourself.
  if (path == "/" || path == "") {
    var context = {};
    // here's how to pass things into the .vt templates
    context.someList = ["Superior","Michigan","Huron","Erie","Ontario"];
    context.someString = "foo";
    context.someInt = Packages.com.google.refine.sampleExtension.SampleUtil.stringArrayLength(context.someList);

    send(request, response, "index.vt", context);
  }
}

function send(request, response, template, context) {
  butterfly.sendTextFromTemplate(request, response, context, template, encoding, html);
}
