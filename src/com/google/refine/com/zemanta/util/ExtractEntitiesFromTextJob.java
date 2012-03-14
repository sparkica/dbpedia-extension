package com.google.refine.com.zemanta.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.google.refine.ProjectManager;
import com.google.refine.model.ReconCandidate;
import com.google.refine.preference.PreferenceStore;
import com.google.refine.util.JSONUtilities;
import com.google.refine.util.ParsingUtilities;

import com.zemanta.api.Zemanta;

/***
 * What does this do?
 * 1. API key is needed
 * 2. GUI to enter API key is needed (like to register service on which to extend data)
 * store API key into settings
 * 3. Takes text as an input, returns entities contained in the text
 * 4. returns JSON
 *  
 * @author mateja
 *
 */

public class ExtractEntitiesFromTextJob {
    static public class DataExtension {
            final public Object[][] data;
            
            public DataExtension(Object[][] data) {
                this.data = data;
            }
    }
    static public class ColumnInfo {
            final public List<String> names;
            final public List<String> path;
            
            protected ColumnInfo(List<String> names, List<String> path) {
                this.names = names;
                this.path = path;
            }
    }
        
    final public JSONObject         extension;
    final public int                columnCount;
    final public List<ColumnInfo>   columns = new ArrayList<ColumnInfo>();
        
    public ExtractEntitiesFromTextJob(JSONObject obj) throws JSONException {
            this.extension = obj;
            this.columnCount = 1; 

            //add columns
            List<String> names = new ArrayList<String>();
            List<String> path = new ArrayList<String>();
            names.add("Extracted entities");
            path.add("entity");
            
            columns.add(new ColumnInfo(names,path));
            
            //(obj.has("properties") && !obj.isNull("properties")) ?
                    //countColumns(obj.getJSONArray("properties"), columns, new ArrayList<String>(), new ArrayList<String>()) : 0;
        }
            
    public Map<String, ExtractEntitiesFromTextJob.DataExtension> extend (
        Set<String> texts,
        Map<String, ReconCandidate> reconCandidateMap
        ) throws Exception {
            
            Map<String, ExtractEntitiesFromTextJob.DataExtension> map = new HashMap<String, ExtractEntitiesFromTextJob.DataExtension>();
            
            PreferenceStore ps  =  ProjectManager.singleton.getPreferenceStore();                                
            String apiKey = (String) ps.get("zemanta-api-key");
            
            System.out.println("Zemanta API key: " + apiKey);
            
            if(apiKey != null) {
            
            
                final String API_SERVICE_URL = "http://api.zemanta.com/services/rest/0.0/";
    
                //initialization of API call
                Zemanta zem = new Zemanta(apiKey, API_SERVICE_URL);
                HashMap<String, String> parameters = new HashMap<String, String>();
                parameters.put("method", "zemanta.suggest_markup");
                parameters.put("api_key", apiKey);
                parameters.put("format", "json");
    
                String text = "";
                for(Iterator<String> singleText = texts.iterator(); singleText.hasNext();) {
                   text = singleText.next();
                    if(text != null) {
                        parameters.put("text", text);
                        String raw = zem.getRawData(parameters); //zemanta api calls
                        JSONObject result = ParsingUtilities.evaluateJsonStringToObject(raw);
                        
                        System.out.println("Raw results: " + raw);
                        if(result != null && result.has("status")) {
                            if(result.get("status").equals("ok")) {
                                ExtractEntitiesFromTextJob.DataExtension ext =  extractRowsWithEntities(reconCandidateMap, text, result);
    
                                if(ext != null) {
                                        map.put(text, ext);
                                }
                            }
                        }
                    
                    }            
                } 
            } else {
                 System.out.println("No API key!");   
            }
            
            return map;
    
    }

    protected ExtractEntitiesFromTextJob.DataExtension extractRowsWithEntities(Map<String, ReconCandidate> reconCandidateMap, String text, JSONObject result) throws JSONException {
        
        Object[][] data = null;
            
        System.out.println("extractRowsWithEntities");
     
        JSONObject markup = result.getJSONObject("markup");
        System.out.println("Markup: ");
        System.out.println(markup);
       
        if(markup.has("links")) {
                            
            JSONArray links = markup.getJSONArray("links");
            int maxRows = links.length();
            data = new Object[maxRows][1]; //TODO: now column is hardcoded to 1
            int column = 0;
    
            for (int row = 0; row < links.length(); row++) {
                //anchor, entity_type[], confidence, target[]
                JSONObject o = links.getJSONObject(row);
                String name = o.getString("anchor");
                String id = "";
                String types[] = {};
                double score = 0.0;
                boolean targetFound = false;
                
                if(o.has("entity_type")) {
                     types = JSONUtilities.getStringArray(o,"entity_type");
                }
                
                //could be used for preview
                if(o.has("target")) {
                    //check the keys
                    JSONArray targets = o.getJSONArray("target");
                    
                    for(int t = 0; (t < targets.length() && !targetFound); t++) {
                            JSONObject target = targets.getJSONObject(t);
                            String target_type = target.getString("type");
                           
                            if(target_type.equals("wikipedia")) {
                                    name = target.getString("title");
                                    id = target.getString("url"); //remove en.wikipedia.org/wiki
                                    targetFound = true;
                                    System.out.println("Wikipedia id!");
                            }
                    }
                }
                
                score = JSONUtilities.getDouble(o, "confidence", 0.0);
                
                ReconCandidate rc = new ReconCandidate(id, name, types, score);
                reconCandidateMap.put(text, rc);
                data[row][column] = rc;
            }
        }

        return new DataExtension(data);
    }

}
