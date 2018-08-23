'use strict';

const flightNamespace = 'org.acme.airline.flight';
const flightTransaction = 'CreateFlight';

const aircraftNamespace = 'org.acme.airline.aircraft';
const aircraftType = 'Aircraft';

const bnUtil = require('./bn-connection-util');
bnUtil.connect(main);

function main(error)
{
    if(error)
    {
        console.log(error);
        process.exit(1);
    }

    const  bnDef = bnUtil.connection.getBusinessNetwork();
    const  factory = bnDef.getFactory();

    addAircraft(factory, 'AIR001', 'OWNED', 5, 15, 60);
    addAircraft(factory, 'AIR002', 'OWNED', 10, 20, 80);
    addAircraft(factory, 'AIR003', 'LEASED', 20, 20, 100);

    addFlight(factory, 'FN001', 'CAR', 'SAN', new Date('2018-09-01T14:00Z'));
    addFlight(factory, 'FN002', 'BAR', 'CAR', new Date('2018-09-05T13:30Z'));
    addFlight(factory, 'FN003', 'SAN', 'BAR', new Date('2018-09-05T13:30Z'));
}


async function addFlight(factory, flightNumber, origin, destination, schedule) 
{
    let transaction = factory.newTransaction(flightNamespace, flightTransaction);
    transaction.setPropertyValue('flightNumber', flightNumber);
    transaction.setPropertyValue('origin', origin);
    transaction.setPropertyValue('destination', destination);
    transaction.setPropertyValue('schedule' , schedule);
    
    try 
    {
        await bnUtil.connection.submitTransaction(transaction);
        console.log('Added flight: ' + flightNumber);
    } 
    catch(e) 
    {
        console.log(e);
    }
}

async function addAircraft(factory, aircraftId, ownershipType, firstClassSeats, businessClassSeats, economyClassSeats) 
{
    let aircraftAsset = factory.newResource(aircraftNamespace, aircraftType, aircraftId);
    aircraftAsset.setPropertyValue('ownershipType', ownershipType);
    aircraftAsset.setPropertyValue('firstClassSeats', firstClassSeats);
    aircraftAsset.setPropertyValue('businessClassSeats', businessClassSeats);
    aircraftAsset.setPropertyValue('economyClassSeats', economyClassSeats);
    
    try 
    {
        let registry = await bnUtil.connection.getAssetRegistry(aircraftNamespace + '.' + aircraftType);
        try 
        {
            await registry.add(aircraftAsset);
            console.log('Aircraft Added');
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