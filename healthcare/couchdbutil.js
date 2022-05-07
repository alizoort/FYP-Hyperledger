/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 * 
 */

'use strict';

exports.createDatabaseIfNotExists = function (nano, dbname) {

    return new Promise((async (resolve, reject) => {
        await nano.db.get(dbname, async function (err, body) {
            if (err) {
                if (err.statusCode == 404) {
                    await nano.db.create(dbname, function (err, body) {
                        if (!err) {
                            console.log("ERR1");
                            resolve(true);
                        } else {
                            console.log("ERR2",err);
                            reject(err);
                        }
                    });
                } else {
                    console.log("ERR3",err)
                    reject(err);
                }
            } else {
               // console.log("ERR4",err)
                resolve(true);
            }
        });
    }));
}

exports.writeToCouchDB = async function (nano, dbname, key, value) {

    return new Promise((async (resolve, reject) => {

        try {
            await this.createDatabaseIfNotExists(nano, dbname);
        } catch (error) {
            console.log("Error creating the database-"+error)
        }

        const db = nano.use(dbname);

        // If a key is not specified, then this is an insert
        if (key == null) {
            console.log("KEY IS NULL ",value)
            db.insert(value, async function (err, body, header) {
                if (err) {
                    reject(err);
                }
            }
            );
        } else {

            // If a key is specified, then attempt to retrieve the record by key
            db.get(key, async function (err, body) {
                // parse the value
                const updateValue = value;
                // if the record was found, then update the revision to allow the update
                if (err == null) {
                    updateValue._rev = body._rev
                }
                // update or insert the value
                db.insert(updateValue, key, async function (err, body, header) {
                    if (err) {
                        reject(err);
                    }
                });
                console.log("INSERT",value)
            });
        }

        resolve(true);

    }));
}

exports.getRecord = async function (nano,dbname,key){
    return new Promise((async  (resolve,reject)=>{
        const db=nano.use(dbname);
        try {
            db.get(key, async function (err, body) {

                // if the record was found, then update the revision to allow the update
                if (err == null) {
                    let revision = body._rev
                    // update or insert the value
                    resolve(body);
                }
                else {
                    reject(err)
                }
            });
        }
        catch(error){
            reject(err)
        }
    }))
}
exports.deleteRecord = async function (nano, dbname, key) {

    return new Promise((async (resolve, reject) => {

        try {
            await this.createDatabaseIfNotExists(nano, dbname);
        } catch (error) {
            console.log("Error creating the database-"+error)
        }

        const db = nano.use(dbname);

        // If a key is specified, then attempt to retrieve the record by key
        db.get(key, async function (err, body) {

            // if the record was found, then update the revision to allow the update
            if (err == null) {

                let revision = body._rev

                // update or insert the value
                db.destroy(key, revision, async function (err, body, header) {
                    if (err) {
                        reject(err);
                    }
                });

            }
        });

        resolve(true);

    }));
}
