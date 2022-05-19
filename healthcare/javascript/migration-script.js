const fs= require('fs');
const path= require('path');
const couchdbutil = require('../couchdbutil.js');
const couchdb_address="http://localhost:5990";
const nano=require('nano')(couchdb_address);
const dbname='originaldb';
const MigrationService = require('./migration.js');
const AssetService = require('./assetService.js');
const migrationSvcInstance = new MigrationService();
const assetSvcInstance = new AssetService();
async function main(){
/**let i=1;
 while (i!=1000){
     await migrationSvcInstance.writeToCouchDB("PATIENT"+i,
     {"firstName":"FirstName"+i,"lastName":"LASTNAME"+i,"gender":"MALE","age":10+i,"bloodType":"A","dob":"21/3/2003","dod":"30/12/2077","phoneNumber":"03999999","address":"Paris"}
     )
     i++;
 }**/
 let j=1;
 while(j<1000){
     let result = await migrationSvcInstance.readFromCouchDB("PATIENT"+j);
     (new AssetService()).createPatient("rami",result.firstName,result.lastName,result.age,result.gender,result.bloodType,result.dob,result.dod,result.phoneNumber,result.address);
     ++j;
 }
}
main()