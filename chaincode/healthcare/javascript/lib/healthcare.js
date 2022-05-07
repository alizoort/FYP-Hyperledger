/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const { Contract } = require('fabric-contract-api');
class HealthCare extends Contract {

    getCurrentDate(){
        var today= new Date();
         return today.toUTCString();
    }

    async initLedger(ctx){
        console.info('============= START : Initialize Ledger ===========');
        const profiles=[
            {
                firstName:"Ali",
                lastName:"Zoort",
                age:"22",
                gender:"Male"
            },
            {
                firstName:"Jad",
                lastName:"Jarade",
                age:"23",
                gender:"Male"
            }
        ]
        for(let i=0;i<profiles.length;i++){
            await ctx.stub.putState('PROFILE'+i,Buffer.from(JSON.stringify(profiles[i])));
            console.log('Added <-->',profiles[i]);
        }
        console.log('======== END : Initialize Ledger =====');
    }
    async ReadAsset(ctx,id){
        const assetJSON=await ctx.stub.getState(id);
        if(!assetJSON || assetJSON.length===0){
            throw new Error(`Asset ${id} does not exist`);
        }
        return assetJSON.toString();
    }
    async QueryPatientProfileByBloodType(ctx,bloodType){
        let queryString={};
        queryString.selector={};
        queryString.selector.bloodType=bloodType;
        return await this.GetQueryResultForQueryString(ctx,JSON.stringify(queryString));
    }
    async GetQueryResultForQueryString(ctx, queryString) {
        console.log("QUERYGETQUERY",queryString)
		let resultsIterator = await ctx.stub.getQueryResult(queryString);
        console.log("QUERYITERTOR",resultsIterator);
		let results = await this._GetAllResults(resultsIterator, false);
		return JSON.stringify(results);
	}
    async QueryAssets(ctx,queryString){
        if(this.checkActorTypeAttribute(ctx,"doctor") || this.checkActorTypeAttribute(ctx,"researcher")){
        return await this.GetQueryResultForQueryString(ctx,queryString);
        }
        else{
            return "unauthorized";
        }
    }
    async GetAssetsByRange(ctx, startKey, endKey) {

		let resultsIterator = await ctx.stub.getStateByRange(startKey, endKey);
		let results = await this._GetAllResults(resultsIterator, false);

		return JSON.stringify(results);
	}
    async GetAssetsWithPagination(ctx,startKey,endKey,pageSize,bookmark){
        const {iterator , metadata }= await ctx.stub.getStateByRangeWithPagination(startKey,endKey,pageSize,bookmark);
        let results = {};
        results.results = await this._GetAllResults(iterator,false);
        results.bookmark= metadata.bookmark;
        return JSON.stringify(results);
    }
    checkActorTypeAttribute(ctx,attrName){
        return ctx.clientIdentity.getAttributeValue("actorType").toString()===attrName;
    }
    async queryProfile(ctx,profileNumber){
        if(this.checkActorTypeAttribute(ctx,"doctor") || this.checkActorTypeAttribute(ctx,"researcher")){
        const profileAsBytes=await ctx.stub.getState(profileNumber);
        if(!profileAsBytes || profileAsBytes.length===0){
            throw new Error(`${profileNumber} does not exist`);
        }
        console.log(profileAsBytes.toString());
        return profileAsBytes.toString();
    }
    else {
        return "unauthorized";
    }
    }
    async GetAssetHistory(ctx, assetName) {
        if(this.checkActorTypeAttribute(ctx,"doctor") || this.checkActorTypeAttribute(ctx,"patient")){
		let resultsIterator = await ctx.stub.getHistoryForKey(assetName);
		let results = await this._GetAllResults(resultsIterator, true);

		return JSON.stringify(results);
        }
        else {
            return "unauthorized";
        }
	}
    async AssetExists(ctx, assetName) {
		// ==== Check if asset already exists ====
		let assetState = await ctx.stub.getState(assetName);
		return assetState && assetState.length > 0;
	}
    async _GetAllResults(iterator, isHistory) {
		let allResults = [];
		let res = await iterator.next();
		while (!res.done) {
			if (res.value && res.value.value.toString()) {
				let jsonRes = {};
				console.log(res.value.value.toString('utf8'));
				if (isHistory && isHistory === true) {
					jsonRes.TxId = res.value.txId;
					jsonRes.Timestamp = res.value.timestamp;
					try {
						jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Value = res.value.value.toString('utf8');
					}
				} else {
					jsonRes.Key = res.value.key;
					try {
						jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
					} catch (err) {
						console.log(err);
						jsonRes.Record = res.value.value.toString('utf8');
					}
				}
				allResults.push(jsonRes);
			}
			res = await iterator.next();
		}
		iterator.close();
		return allResults;
	}
    async createPatientProfile(ctx,submittedBy, patientNumber ,firstName,lastName, age, gender,bloodType,dob,dod,phoneNumber,address){
        if(this.checkActorTypeAttribute(ctx,"doctor")){
        let dateTime= this.getCurrentDate();
        const patient = {
            firstName,
            lastName,
            age,
            gender,
            bloodType,
            dob,dod,
            phoneNumber,address,submittedBy,dateTime
        }
        let record;
        let val =await ctx.stub.putState('PATIENT'+patientNumber,Buffer.from(JSON.stringify(patient)))
        try {
            record = JSON.parse(val);
        }
        catch(err){
            record=val;
        }
        return JSON.stringify(record);
    }
    else {
        return "unauthorized"
    }
    }
    async createDrugPrescription(ctx,submittedBy,prescriptionNumber,doseVal,doseUnit,drug,drugType,patientNumber,doctorNumber){
        if(this.checkActorTypeAttribute(ctx,"doctor")){
        let dateTime= this.getCurrentDate();
        const drugPrescription= {
            doseVal,
            doseUnit,
            drug,
            drugType,
            patientNumber,
            doctorNumber,submittedBy,dateTime
        }
        let record;
        let val = await ctx.stub.putState('PRESCRIPTION_DRUG'+prescriptionNumber,Buffer.from(JSON.stringify(drugPrescription)));
        try {
            record = JSON.parse(val);
        }
        catch(err){
            record=val;
        }
        return JSON.stringify(record);

    }
    else {
        return "unauthorized";
    }
    }
    async createPatientAppointment(ctx,submittedBy,appointmentNumber,dateOfAppointment,patientNumber,doctorNumber,time){
        if(this.checkActorTypeAttribute(ctx,"patient") || this.checkActorTypeAttribute(ctx,"doctor")){
            let dateTime=this.getCurrentDate();
        const appointment={
            dateOfAppointment,
            patientNumber,
            doctorNumber,
            time,submittedBy,dateTime
        }
        let record;
        let val = await ctx.stub.putState("APPOINTMENT"+appointmentNumber,Buffer.from(JSON.stringify(appointment)));
        try {
            record = JSON.parse(val);
        }
        catch(err){
            record = val;
        }
        return JSON.stringify(record);
    }
    else {
        return "unauthorized";
    }
    }
    async createDoctorProfile(ctx,submittedBy,doctorNumber,firstName,lastName,gender,phoneNumber,address,organizationName,specialization){
        let dateTime= this.getCurrentDate();
        const doctorProfile = {
            firstName,
            lastName,
            gender,
            phoneNumber,
            address,
            organizationName,
            specialization,submittedBy,dateTime
        }
        let record;
        let val = await ctx.stub.putState("DOCTOR"+doctorNumber,Buffer.from(JSON.stringify(doctorProfile)));
        try {
            record= JSON.parse(val)
        }
        catch(err){
            record=val;
        }
        return JSON.stringify(record);
    }
    async createProfile(ctx,submittedBy,profileNumber,firstName,lastName,age,gender){
        console.log('======= START : Create Profile ========');
        let dateTime= this.getCurrentDate();
        const profile = {
            firstName,
            lastName,
            gender,
            age,submittedBy,dateTime
        }
        let record;
        let val= await ctx.stub.putState('PROFILE'+profileNumber,Buffer.from(JSON.stringify(profile)));
        console.log('====== END : Create Profile =======');
        try {
            record =JSON.parse(val);
        }
        catch(err){
            record=val;
        }
        return JSON.stringify(record);
    }
    async queryAllProfiles(ctx){
        if(this.checkActorTypeAttribute(ctx,"researcher") || this.checkActorTypeAttribute(ctx,"doctor")){
        const startKey='';
        const endKey='';
        const allResults=[];
        for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
            const strValue = Buffer.from(value).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push({ Key: key, Record: record });
        }
        console.info(allResults);
        return JSON.stringify(allResults);
    }
    else {
        return "unauthorized";
    }
    }
    async queryByKey(ctx,key){
        let value = await ctx.stub.getState(key);
        const strValue=Buffer.from(value).toString('utf8');
        let record;
        try{
            record=JSON.parse(strValue);
        }
        catch(err){
            console.log(err);
            record=strValue;
        }
        return JSON.stringify({Key:key,Record:record});
    }
    async changePatientProfile(ctx,submittedBy,patientNumber,firstName,lastName, age, gender,bloodType,dob,dod,phoneNumber,address){
        if(this.checkActorTypeAttribute(ctx,"patient") || this.checkActorTypeAttribute(ctx,"doctor")){
        const profileAsBytes=await ctx.stub.getState(patientNumber);
        if(!profileAsBytes || profileAsBytes.length===0){
            throw new Error(`${profileAsBytes} does not exist`);
        }
        let dateTime= this.getCurrentDate();
        let patient=JSON.parse(profileAsBytes.toString());
        patient.firstName=firstName;
        patient.lastName=lastName;
        patient.age=age;
        patient.gender=gender;
        patient.bloodType=bloodType;
        patient.dod=dod;
        patient.dob=dob;
        patient.phoneNumber=phoneNumber;
        patient.address=address;
        patient.submittedBy=submittedBy;
        patient.dateTime=dateTime;
        let record;
        let val =await ctx.stub.putState(patientNumber,Buffer.from(JSON.stringify(patient)));
        try {
            record= JSON.parse(val)
        }
        catch(err){
            record=val;
        }
        return JSON.stringify(record);
    }
    else {
        return "unauthorized";
    }
    }
    async changePatientAppointment(ctx,submittedBy,appNumber,dateOfAppointment,doctorNumber,time){
        if(this.checkActorTypeAttribute(ctx,"doctor")){
        const profileAsBytes=await ctx.stub.getState(appNumber);
        if(!profileAsBytes || profileAsBytes.length===0){
            throw new Error(`${profileAsBytes} does not exist`);
        }
        let dateTime= this.getCurrentDate();
        let appointment=JSON.parse(profileAsBytes.toString());
        appointment.dateOfAppointment=dateOfAppointment;
        appointment.doctorNumber=doctorNumber;
        appointment.time=time;
        appointment.submittedBy=submittedBy;
        appointment.dateTime=dateTime;
        let record;
        let val =await ctx.stub.putState(appNumber,Buffer.from(JSON.stringify(appointment)));
        try {
            record= JSON.parse(val)
        }
        catch(err){
            record=val;
        }
        return JSON.stringify(record);
    }
    else {
        return "unauthorized";
    }
    }
    async changePatientPrescription(ctx,submittedBy,prescriptionNumber,doseVal,doseUnit,drug,drugType,patientNumber,doctorNumber){
        if(this.checkActorTypeAttribute(ctx,"doctor")){
        const profileAsBytes=await ctx.stub.getState(prescriptionNumber);
        if(!profileAsBytes || profileAsBytes.length===0){
            throw new Error(`${profileAsBytes} does not exist`);
        }
        let prescription=JSON.parse(profileAsBytes.toString());
        let dateTime = this.getCurrentDate();
        prescription.doseVal=doseVal;
        prescription.doseUnit=doseUnit;
        prescription.drug=drug;
        prescription.drugType=drugType;
        prescription.patientNumber=patientNumber;
        prescription.doctorNumber=doctorNumber;
        prescription.submittedBy=submittedBy;
        prescription.dateTime=dateTime;
        let record;
        let val =await ctx.stub.putState(prescriptionNumber,Buffer.from(JSON.stringify(prescription)));
        try {
            record= JSON.parse(val)
        }
        catch(err){
            record=val;
        }
        return JSON.stringify(record);
    }
    else {
        return "unauthorized";
    }
    }
    async changeProfileAge(ctx,profileNumber,newAge){
        console.log('======== START : change age =======');
        const profileAsBytes=await ctx.stub.getState(profileNumber);
        if(!profileAsBytes || profileAsBytes.length===0){
            throw new Error(`${profileAsBytes} does not exist`);
        }
        const profile=JSON.parse(profileAsBytes.toString());
        profile.age=newAge;
        await ctx.stub.putState(profileNumber,Buffer.from(JSON.stringify(profile)));
        console.log('======= END : changeProfile =======');
    }
}
module.exports= HealthCare;
