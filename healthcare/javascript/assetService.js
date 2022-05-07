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
        console.log("CCPATH",ccpPath)
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
            console.log("AFTERCONNECT");
            const network = await this.gateway.getNetwork('mychannel');
            console.log("NETWORK",network);
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
    async checkIfAssetExist(enrollmentID,assetToFind){
        let queryString={};
        queryString.selector={};
        Object.keys(assetToFind).forEach(key=>{
            queryString.selector[key]=assetToFind[key];
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
    async getAssetHistory(enrollmentID,assetName){
        const contract = await this.getContractInstance(enrollmentID);
        let result = contract.submitTransaction('GetAssetHistory',assetName);
        return result;
    }

    async modifyPatient(enrollmentID,patientNumber,firstName,lastName,age,gender,bloodType,dob,dod,phoneNumber,address){
        const contract = await this.getContractInstance(enrollmentID);
        let result = contract.submitTransaction('changePatientProfile',enrollmentID, patientNumber,firstName,lastName,age,gender,bloodType,dob,dod,phoneNumber,address);
        return result;
    }
    async modifyAppointment(enrollmentID,appNumber,dateOfAppointment,doctorNumber,time){
        const contract = await this.getContractInstance(enrollmentID);
        let result = contract.submitTransaction('changePatientAppointment',enrollmentID, appNumber,dateOfAppointment,doctorNumber,time);
        return result;
    }
    async modifyPrescription(enrollmentID,prescriptionNumber,doseVal,doseUnit,drug,drugType,patientNumber,doctorNumber){
        const contract = await this.getContractInstance(enrollmentID);
        let result = contract.submitTransaction('changePatientPrescription',enrollmentID, prescriptionNumber,doseVal,doseUnit,drug,drugType,patientNumber,doctorNumber);
        return result;
    }
    async createPatientAppointment(enrollmentID,dateOfAppointment,patientNumber,doctorNumber,time){
        const addAssetsConfigFile=path.resolve(__dirname,'addAssets.json');
        const channelid=config.channelid;
        let nextAppNumber;
        let addAssetsConfig;
        if(fs.existsSync(addAssetsConfigFile)){
            let addAssetConfigJSON=fs.readFileSync(addAssetsConfigFile,'utf8');
            addAssetsConfig=JSON.parse(addAssetConfigJSON);
            nextAppNumber=addAssetsConfig.nextAppNumber;
            if(addAssetsConfig.nextAppNumber){ nextAppNumber = addAssetsConfig.nextAppNumber} 
            else {
                nextAppNumber=1;
                addAssetsConfig.nextAppNumber=nextAppNumber;
                fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2))
            }
        }
        else {
            nextAppNumber=1;
            addAssetsConfig= new Object;
            addAssetsConfig.nextAppNumber=nextAppNumber;
            fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2));
        }
        const contract= await this.getContractInstance(enrollmentID);
        try{ 
            let result= await contract.submitTransaction('createPatientAppointment', enrollmentID, nextAppNumber,dateOfAppointment,patientNumber,doctorNumber,time);
             addAssetsConfig.nextAppNumber=nextAppNumber+1;
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
            nextPrescriptionNumber=1;
            addAssetsConfig= new Object;
            addAssetsConfig.nextPrescriptionNumber=nextPrescriptionNumber;
            fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2));
        }
        const contract= await this.getContractInstance(enrollmentID);
        try{ 
            let result= await contract.submitTransaction('createDrugPrescription', enrollmentID, nextPrescriptionNumber,doseVal,doseUnit,drug,drugType,patientNumber,doctorNumber);
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
            let result= await contract.submitTransaction('createDoctorProfile', enrollmentID,nextDoctorNumber, firstName, lastName, gender, phoneNumber,address, organizationName,specialization);
             addAssetsConfig.nextDoctorNumber=nextDoctorNumber+1;
             fs.writeFileSync(addAssetsConfigFile, JSON.stringify(addAssetsConfig, null, 2));
             console.log("RESULT",JSON.parse(result));
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
        let queryResult=await this.checkIfAssetExist(enrollmentID,{"firstName":firstName,"lastName":lastName,"age":age.toString(),"gender":gender,"bloodType":bloodType,"dob":dob,"dod":dod,"phoneNumber":phoneNumber,"address":address})
        console.log("QYERYRESULT",JSON.parse(queryResult.toString()));
        if(queryResult && JSON.parse(queryResult.toString()).length==0){
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
        console.log("BEFORE CONTRACT",enrollmentID)
       const contract = await this.getContractInstance(enrollmentID);
       console.log("HERE",contract);
       try{ 
           let result= await contract.submitTransaction('createPatientProfile',enrollmentID, nextPatientNumber, firstName, lastName, age,gender,bloodType,dob,dod,phoneNumber,address);
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
    else {
        return "already exist";
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