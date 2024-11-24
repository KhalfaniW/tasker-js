sLog("00000000000");
// // performTask("AutoInputQuery",1,'','','',false,true)
sLog("BEGIN");
performTask("AutoInputQuery", 99999);
// // performTask( str taskName, int priority, str parameterOne, str parameterTwo, str returnVariable, bool stop, bool variablePassthrough, str variablePassthroughList, bool resetReturnVariable )

wait(100);
var x = global("%AllVars");
//flash(global("%AllVars"))

sLog(x.length);

log(global("%AllVars"));

sLog("END");
