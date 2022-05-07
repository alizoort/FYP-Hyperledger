
const couchdbutil = require('../couchdbutil.js');
const couchdb_address="http://localhost:5990";
const nano=require('nano')(couchdb_address);
const dbname='originaldb';
class MigrationService {
    constructor(){

    }

    async writeToCouchDB(key,record){
        try {
        let result= await couchdbutil.writeToCouchDB(nano,dbname,key,record);
        return result;    
    }
        catch(error){
            console.log(error);
            throw new Error(`Error ${error}`);
        }
    }
    async readFromCouchDB(key){
        try {
            let result = await couchdbutil.getRecord(nano,dbname,key)
            return result;
        }
        catch(error){
            console.log(error);
            throw new Error(`Error ${error}`);
        }
    }
}
module.exports=MigrationService;