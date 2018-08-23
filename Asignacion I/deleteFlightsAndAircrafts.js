'use strict';

const flightNamespace = 'org.acme.airline.flight';
const flightType = 'Flight';

const aircraftNamespace = 'org.acme.airline.aircraft';
const aircraftType = 'Aircraft';

const bnUtil = require('./bn-connection-util');
bnUtil.connect(main);

async function main(error)
{
    if(error)
    {
        console.log(error);
        process.exit(1);
    }

    try 
    {
        let registryFlight = await bnUtil.connection.getAssetRegistry(flightNamespace + '.' + flightType);
        try 
        {
            let registryAircraft = await bnUtil.connection.getAssetRegistry(aircraftNamespace + '.' + aircraftType);
            try 
            {
                let flights = await registryFlight.getAll();
                try 
                {
                    await registryFlight.removeAll(flights);
                    console.log("Removed all flights!");
                    
                    let aircrafts = await registryAircraft.getAll();
                    try 
                    {
                        await registryAircraft.removeAll(aircrafts);
                        console.log("Removed all aircrafts!");
                        bnUtil.disconnect();
                    } 
                    catch(e) 
                    {
                        console.log(e);
                        bnUtil.disconnect();
                    }
                } 
                catch(e) 
                {
                    console.log(e);
                }
            } 
            catch(e) 
            {
                console.log(e);
            }
        }
        catch(e) 
        {
            console.log(e);
        }
    } 
    catch(e) 
    {
        console.log(e);
    }
}