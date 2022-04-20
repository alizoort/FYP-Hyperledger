'use strict';
const express = require('express')
const app = express()
app.set('view engine', 'ejs')

const bodyParser = require('body-parser');
const url = require('url');
const querystring = require('querystring');
// Bring key classes into scope, most importantly Fabric SDK network class
const fs = require('fs');
const yaml = require('js-yaml');

app.use(express.static('public'))

const { Wallets } = require('fabric-network');
const path = require('path');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const AssetService = require('./assetService.js');
const EnrollmentService = require('./enrollService.js');
const QueryService = require('./queryService.js');
const RegisterUserService = require('./registrationService.js');
const assetSvcInstance = new AssetService();
const querySvcInstance = new QueryService();
const enrollSvcInstance = new EnrollmentService();
const registerSvcInstance = new RegisterUserService();
app.post('/enrollAdmin',async (req,res,next)=>{
    try {
        const result = enrollSvcInstance.enrollAdmin();
        console.log("Result",result);
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.post('/registerUser',async (req,res,next)=>{
    var username= req.body.username;
    try {
        if(!username || username.length<1){
            return res.status(500).json("User is missing");
        }
        const result= registerSvcInstance.registerUser(username,req.body.actorTypr);
        console.log("Successfully called register user !!!");
        return res.status(200).json(`Successfully register the user ${username}`);
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.post('/createPatientProfile',async (req,res,next)=>{
    try {
        const result = assetSvcInstance.createPatient(req.body.adminId,req.body.firstName,req.body.lastName,req.body.age,req.body.gender,req.body.bloodType,req.body.dob,req.body.dod,req.body.phoneNumber,req.body.address)
        return res.status(200).json(`Successfully create the patient profile ${result}`)
    
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.post('/createDoctorProfile',async (req,res,next)=>{
    try {
        const result = assetSvcInstance.createDoctor(req.body.adminId,req.body.firstName,req.body.lastName,req.body.gender,req.body.phoneNumber,req.body.address, req.body.organizationName,req.body.specialization)
        return res.status(200).json(`Successfully create the patient profile ${result}`)
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.post('/createDrugPrescription',async (req,res,next)=>{
    try {
        const result = assetSvcInstance.createDrugPrescription(req.body.adminId,req.body.doseVal,req.body.doseUnit,req.body.drug,req.body.drugType,req.body.patientNumber,req.body.doctorNumber);
        return res.status(200).json(`Successfully create drug prescription ${result}`);
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.get('/getAssetByRange',async (req,res,next)=>{
    try {
        const result = assetSvcInstance.getAssetByRange(req.body.adminId,req.body.assetName1,req.body.assetName2);
        return res.status(200).json(result);
    }
    catch(error) {
        return res.status(500).json(error);
    }
})
app.get('/readAsset',async (req,res,next)=>{
    try {
        const result = await assetSvcInstance.readAsset(req.body.adminId,req.body.assetName);
        return res.status(200).json(JSON.parse(result.toString()));
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.get('/isAssetPresent',async (req,res,next)=>{
    try {
        const result = assetSvcInstance.isAssetPresent(req.body.adminId,req.body.assetName);
        return res.status(200).json(result);
    }
    catch(error) {
        return res.status(500).json(error);
    }
})
app.get('/queryWithPagination',async (req,res,next)=>{
    try {
        const result = await assetSvcInstance.queryWithPagination(req.body.adminId,req.body.fields,req.body.index,req.body.indexName,'1','')
        return res.status(200).json(JSON.parse(result.toString()));
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.get('/queryAsset',async (req,res,next)=>{
    try {
        const result = await assetSvcInstance.queryAsset(req.body.adminId,req.body.fields,req.body.index,req.body.indexName)
        console.log(result)
        return res.status(200).json(JSON.parse(result.toString()));
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.post('/createProfile',async (req,res,next)=>{
    try {
        const result = assetSvcInstance.createProfile(req.body.adminId,req.body.profileNumber,req.body.firstName,req.body.lastName,req.body.gender,req.body.age);
    return res.status(200).json(`Successfully create the asset ${result}`);
    }
    catch(error){
        return res.status(500).json(error);
    }
})
app.get('/queryByKey',async (req,res,next)=>{
    var userName = req.body.username;
    try {
        if(!userName || userName.lenth<1) {
            return res.status(500).json("User is missing");
          } else {
            const result = await querySvcInstance.queryByKey(userName, req.body.key);
            return res.status(200).json(result);
          }
    }
    catch (error) {
        return res.status(500).json(error);
      }
})
app.get('/queryAllProfiles',async (req,res,next)=>{
    var userName = req.body.username;
    try {
        if(!userName || userName.lenth<1) {
            return res.status(500).json("User is missing");
          } else {
            const result = await querySvcInstance.queryAllProfiles(userName);
            return res.status(200).json(result);
          }
    }
    catch (error) {
        return res.status(500).json(error);
      }
})

var port = process.env.PORT || 30002;
var server = app.listen(port, function () {
   var host = server.address().address
   var port = server.address().port
   console.log("App listening at http://%s:%s", host, port)
})