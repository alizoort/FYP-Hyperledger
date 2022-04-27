/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const config=require('./config.json');
class AssetService {
    constructor(){
        this.gateway=new Gateway();
    }
    async getContractInstance(enrollmentID){
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
            const identity = await wallet.get(enrollmentID);
            if (!identity) {
                console.log('An identity for the user "appUser" does not exist in the wallet');
                console.log('Run the registerUser.js application before retrying');
                return;
            }
            this.gateway = new Gateway();
            await this.gateway.connect(ccp, { wallet, identity: enrollmentID, discovery: { enabled: true, asLocalhost: true } });
            const network = await this.gateway.getNetwork('mychannel');
            const contract = await network.getContract('healthcare');
            return contract;
    }
    async getAssetByRange(enrollmentID,assetName1,assetName2){
        const contract = await this.getContractInstance(enrollmentID);
        let result = await contract.evaluateTransaction('GetAssetByRange',assetName1,assetName2);
        return result;
    }
    async readAsset(enrollmentID,assetName){
        const contract = await this.getContractInstance(enrollmentID);
        let result =await contract.evaluateTransaction('ReadAsset',assetName);
        return result;
    }
    async isAssetPresent(enrollmentID,assetName){
        const contract = this.getContractInstance(enrollmentID);
        let result = await contract.evaluateTransaction('AssetExists',assetName);
        return result;
    }
    async queryWithPagination(enrollmentID,fieldsObject,index,indexName,pageSize,bookmark){
        let queryString={};
        queryString.selector={};
        queryString.use_index=[index,indexName];
        Object.keys(fieldsObject).forEach(key=>{
            queryString.selector[key]=fieldsObject[key];
        })
        const contract = await this.getContractInstance(enrollmentID);
        let result = await contract.evaluateTransaction('QueryAssetsWithPagination',JSON.stringify(queryString),pageSize,bookmark);
        return result;
    }
    async queryAsset(enrollmentID,fieldsObject,index,indexName){
        let queryString={};
        queryString.selector={};
        queryString.use_index=[index,indexName];
        Object.keys(fieldsObject).forEach(key=>{
            queryString.selector[key]=fieldsObject[key];
        })
        console.log("QUERYSTRING",queryString);
        const contract = await this.getContractInstance(enrollmentID);
        let result = contract.evaluateTransaction('QueryAssets',JSON.stringify(queryString));
        return result;  
    }
    async queryByField(enrollmentID,field,index,indexName){
        let queryString={};
        queryString.selector={};
        console.log("FIELD",field)
        queryString.selector[field.name]={"$eq":field.value};
        queryString.use_index=[index,indexName];
        const contract=await this.getContractInstance(enrollmentID);
        let result= contract.evaluateTransaction('QueryAssets',JSON.stringify(queryString))
        return result;
    }
    async createDrugPrescription(enrollmentID,doseVal,doseUnit,drug,drugType,patientNumber,doctorNumber){
        const addAssetsConfigFile=path.resolve(__dirname,'addAssets.json');
        const channelid=config.channelid;
        let nextPrescriptionNumber;
        let addAssetsConfig;
        if(fs.existsSync(addAssetsConfigFile)){
            let addAssetConfigJSON=fs.readFileSync(addAssetsConfigFile,'utf8');
            addAssetsConfig=JSON.parse(addAssetConfigJSON);
            nextPrescriptionNumber=addAssetsConfig.nextPrescriptionNumber;
            if(addAssetsConfig.nextPrescriptionNumber){ nextPrescriptionNumber = addAssetsConfig.nextPrescriptionNumber} 
            else {
                nextPrescriptionNumber=1;
                addAssetsConfig.nextPrescriptionNumber=nextPrescriptionNumber;
                fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2))
            }
        }
        else {
            nextDoctorNumber=1;
            addAssetsConfig= new Object;
            addAssetsConfig.nextPrescriptionNumber=nextPrescriptionNumber;
            fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2));
        }
        const contract= await this.getContractInstance(enrollmentID);
        try{ 
            let result= await contract.submitTransaction('createDrugPrescription', nextPrescriptionNumber,doseVal,doseUnit,drug,drugType,patientNumber,doctorNumber);
             addAssetsConfig.nextPrescriptionNumber=nextPrescriptionNumber+1;
             fs.writeFileSync(addAssetsConfigFile, JSON.stringify(addAssetsConfig, null, 2));
             return result? JSON.parse(result):result;
         } 
         catch (error) {
             console.log(`Error processing transaction ${error}`);
             console.log(error.stack);
             throw ({ status: 500, message: `Error processing transaction. ${error}` });
         }
         finally{
             console.log('Disconnect from Fabric gateway');
             await this.gateway.disconnect();
         }
    }
    async createDoctor(enrollmentID,firstName,lastName, gender, phoneNumber, address, organizationName, specialization){
        const addAssetsConfigFile=path.resolve(__dirname,'addAssets.json');
        const channelid=config.channelid;
        let nextDoctorNumber;
        let addAssetsConfig;
        if(fs.existsSync(addAssetsConfigFile)){
            let addAssetConfigJSON=fs.readFileSync(addAssetsConfigFile,'utf8');
            addAssetsConfig=JSON.parse(addAssetConfigJSON);
            nextDoctorNumber=addAssetsConfig.nextDoctorNumber;
            if(addAssetsConfig.nextDoctorNumber){ nextDoctorNumber = addAssetsConfig.nextDoctorNumber} 
            else {
                nextDoctorNumber=1;
                addAssetsConfig.nextDoctorNumber=nextDoctorNumber;
                fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2))
            }
        }
        else {
            nextDoctorNumber=1;
            addAssetsConfig= new Object;
            addAssetsConfig.nextDoctorNumber=nextDoctorNumber;
            fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2));
        }
        const contract= await this.getContractInstance(enrollmentID);
        try{ 
            let result= await contract.submitTransaction('createDoctorProfile', nextDoctorNumber, firstName, lastName, gender, phoneNumber,address, organizationName,specialization);
             addAssetsConfig.nextDoctorNumber=nextDoctorNumber+1;
             fs.writeFileSync(addAssetsConfigFile, JSON.stringify(addAssetsConfig, null, 2));
             return result? JSON.parse(result):result;
         } 
         catch (error) {
             console.log(`Error processing transaction ${error}`);
             console.log(error.stack);
             throw ({ status: 500, message: `Error processing transaction. ${error}` });
         }
         finally{
             console.log('Disconnect from Fabric gateway');
             await this.gateway.disconnect();
         }
    }

    async createPatient(enrollmentID,firstName,lastName,age,gender,bloodType,dob,dod,phoneNumber,address){
        const addAssetsConfigFile=path.resolve(__dirname,'addAssets.json');
        const channelid=config.channelid;
        let nextPatientNumber;
        let addAssetsConfig;
        console.log("INSIDE PATIENT")
        if(fs.existsSync(addAssetsConfigFile)){
            let addAssetConfigJSON=fs.readFileSync(addAssetsConfigFile,'utf8');
            addAssetsConfig=JSON.parse(addAssetConfigJSON);
           // nextPatientNumber=addAssetsConfig.nextPatientNumber;
           console.log(addAssetConfigJSON.nextPatientNumber)
            if(addAssetsConfig.nextPatientNumber){ 
                console.log("INSIDE IF")
                nextPatientNumber = addAssetsConfig.nextPatientNumber} 
            else {
                nextPatientNumber=1;
                addAssetsConfig.nextPatientNumber=nextPatientNumber;
                fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2))
            }
        }
        else{
            nextPatientNumber=1;
            addAssetsConfig= new Object;
            addAssetsConfig.nextPatientNumber=nextPatientNumber;
            fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2));
        }
        console.log("BEFORE CONTRACT")
       const contract = await this.getContractInstance(enrollmentID);
       console.log("HERE",contract);
       try{ 
           let result= await contract.submitTransaction('createPatientProfile', nextPatientNumber, firstName, lastName, age,gender,bloodType,dob,dod,phoneNumber,address);
            console.log('Transaction has been submitted');
            addAssetsConfig.nextPatientNumber=nextPatientNumber+1;
            fs.writeFileSync(addAssetsConfigFile, JSON.stringify(addAssetsConfig, null, 2));
            return result? JSON.parse(result):result;
        } 
        catch (error) {
            console.log(`Error processing transaction ${error}`);
            console.log(error.stack);
            throw ({ status: 500, message: `Error processing transaction. ${error}` });
        }
        finally{
            console.log('Disconnect from Fabric gateway');
            await this.gateway.disconnect();
        }
    }
    async createProfile(enrollmentID,profileNumber,firstName,lastName,gender,age){
        const addAssetsConfigFile=path.resolve(__dirname,'addAssets.json');
        const channelid=config.channelid;
        let nextAssetNumber;
        let addAssetsConfig;
        if(fs.existsSync(addAssetsConfigFile)){
            let addAssetConfigJSON = fs.readFileSync(addAssetsConfigFile,'utf8');
            addAssetsConfig=JSON.parse(addAssetConfigJSON);
          //  nextAssetNumber = addAssetsConfig.nextAssetNumber;
            if(addAssetsConfig.nextAssetNumber){ nextAssetNumber = addAssetsConfig.nextAssetNumber} 
            else {
                nextAssetNumber=1;
                addAssetsConfig.nextAssetNumber=nextAssetNumber;
                fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2))
            }
        }
        else{
            nextAssetNumber=1;
            addAssetsConfig= new Object;
            addAssetsConfig.nextAssetNumber=nextAssetNumber;
            fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2))
        }
           const contract =await  this.getContractInstance(enrollmentID);
           try{
           let result= await contract.submitTransaction('createProfile', nextAssetNumber, firstName, lastName, age,gender);
            addAssetsConfig.nextAssetNumber=nextAssetNumber+1;
            fs.writeFileSync(addAssetsConfigFile, JSON.stringify(addAssetsConfig, null, 2));
            return result? JSON.parse(result):result;
        } 
        catch (error) {
            console.log(`Error processing transaction ${error}`);
            console.log(error.stack);
            throw ({ status: 500, message: `Error processing transaction. ${error}` });
        }
        finally{
            console.log('Disconnect from Fabric gateway');
            await this.gateway.disconnect();
        }
    }
}
module.exports=AssetService;