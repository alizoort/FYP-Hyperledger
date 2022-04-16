/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';
const { Contract } = require('fabric-contract-api');
class HealthCare extends Contract {

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
    async queryProfile(ctx,profileNumber){
        const profileAsBytes=await ctx.stub.getState(profileNumber);
        if(!profileAsBytes || profileAsBytes.length===0){
            throw new Error(`${profileNumber} does not exist`);
        }
        console.log(profileAsBytes.toString());
        return profileAsBytes.toString();
    }
    async createProfile(ctx,profileNumber,firstName,lastName,age,gender){
        console.log('======= START : Create Profile ========');
        const profile = {
            firstName,
            lastName,
            gender,
            age
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
