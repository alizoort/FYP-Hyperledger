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
    async createProfile(enrollmentID,profileNumber,firstName,lastName,gender,age){
        const addAssetsConfigFile=path.resolve(__dirname,'addAssets.json');
        const channelid=config.channelid;
        let nextAssetNumber;
        let addAssetsConfig;
        if(fs.existsSync(addAssetsConfigFile)){
            console.log("HERE");
            let addAssetConfigJSON = fs.readFileSync(addAssetsConfigFile,'utf8');
            addAssetsConfig=JSON.parse(addAssetConfigJSON);
            nextAssetNumber = addAssetsConfig.nextAssetNumber;
        }
        else{
            nextAssetNumber=1;
            addAssetsConfig= new Object;
            addAssetsConfig.nextAssetNumber=nextAssetNumber;
            fs.writeFileSync(addAssetsConfigFile,JSON.stringify(addAssetsConfig,null,2))
        }
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
            // load the network configuration
          
            console.log(`Wallet path: ${walletPath}`);
    
            // Check to see if we've already enrolled the user.
            const identity = await wallet.get(enrollmentID);
            if (!identity) {
                console.log('An identity for the user "appUser" does not exist in the wallet');
                console.log('Run the registerUser.js application before retrying');
                return;
            }
    
            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: enrollmentID, discovery: { enabled: true, asLocalhost: true } });
    console.log("CONNECTED",gateway);
            // Get the network (channel) our contract is deployed to.
        try{    const network = await gateway.getNetwork('mychannel');
            console.log("NETWORK",network)
    
            // Get the contract from the network.
            const contract = await network.getContract('healthcare');
    console.log("CONGTRACT",contract)
            // Submit the specified transaction.
            // createCar transaction - requires 5 argument, ex: ('createCar', 'CAR12', 'Honda', 'Accord', 'Black', 'Tom')
            // changeCarOwner transaction - requires 2 args , ex: ('changeCarOwner', 'CAR12', 'Dave')
           let result= await contract.submitTransaction('createProfile', nextAssetNumber, firstName, lastName, age,gender);
            console.log('Transaction has been submitted');
            addAssetsConfig.nextAssetNumber=nextAssetNumber+1;
            fs.writeFileSync(addAssetsConfigFile, JSON.stringify(addAssetsConfig, null, 2));
            return result? JSON.parse(result):result;
            // Disconnect from the gateway.
            
    
        } 
        catch (error) {
            console.log(`Error processing transaction ${error}`);
            console.log(error.stack);
            throw ({ status: 500, message: `Error processing transaction. ${error}` });
        }
        finally{
            console.log('Disconnect from Fabric gateway');
            await gateway.disconnect();
        }
    }
}
module.exports=AssetService;