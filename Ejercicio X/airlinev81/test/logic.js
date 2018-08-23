'use strict';

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkDefinition, CertificateUtil, IdCard } = require('composer-common');

const path = require('path');

const chai = require('chai');
chai.should();
chai.use(require('chai-as-promised'));

const aircraftNamespace = 'org.acme.airline.aircraft';
const aircraftAsset = 'Aircraft';
const aircraftTransaction = 'AssignAircraft';

const flightNamespace = 'org.acme.airline.flight';
const flightAsset = 'Flight';
const flightTransaction = 'CreateFlight';

const assert = chai.assert;

describe('Transactions Add Validate', () => {
    
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );

    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };

    const adminCardName = 'admin';

    let adminConnection;

    let businessNetworkConnection;

    let factory;

    let events;

    let businessNetworkName;

    before(async () => {

        const credentials = CertificateUtil.generate({ commonName: 'admin' });
        const metaData = {
            version: 1,
            userName: 'PeerAdmin',
            roles: [ 'PeerAdmin', 'ChannelAdmin' ]
        };
        const deployerCard = new IdCard(metaData, connectionProfile);
        deployerCard.setCredentials(credentials);
        const deployerCardName = 'PeerAdmin';

        adminConnection = new AdminConnection({ cardStore: cardStore });
        businessNetworkConnection = new BusinessNetworkConnection({ cardStore: cardStore });

        await adminConnection.importCard(deployerCardName, deployerCard);
        await adminConnection.connect(deployerCardName);

        let businessNetworkDefinition = await BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
        businessNetworkName = businessNetworkDefinition.getName();
        await adminConnection.install(businessNetworkDefinition);
        
        const startOptions = {
            networkAdmins: [
                {
                    userName: 'admin',
                    enrollmentSecret: 'adminpw'
                }
            ]
        };

        const adminCards = await adminConnection.start(businessNetworkName, businessNetworkDefinition.getVersion(), startOptions);
        await adminConnection.importCard(adminCardName, adminCards.get('admin'));
        
        events = [];
        businessNetworkConnection.on('event', event => {
            events.push(event);
        });
        await businessNetworkConnection.connect(adminCardName);

        factory = businessNetworkConnection.getBusinessNetwork().getFactory();

    });

    it('Sunny day scenario', async () => {
        let aircraftRegistry = await businessNetworkConnection.getAssetRegistry(aircraftNamespace + '.' + aircraftAsset);

        let aircraftResource = factory.newResource(aircraftNamespace, aircraftAsset, 'CRAFT001');
        aircraftResource.setPropertyValue('ownershipType', 'LEASED');
        aircraftResource.setPropertyValue('firstClassSeats', 5);
        aircraftResource.setPropertyValue('businessClassSeats', 15);
        aircraftResource.setPropertyValue('economyClassSeats', 50);

        try 
        {
            await aircraftRegistry.add(aircraftResource); 
            console.log('Successfully created the CRAFT001 aircraft');

            let transaction = factory.newTransaction(flightNamespace, flightTransaction);
            transaction.setPropertyValue('flightNumber','AE101');
            transaction.setPropertyValue('origin', 'CAR');
            transaction.setPropertyValue('destination' , 'SAN');
            transaction.setPropertyValue('schedule' , new Date('2018-12-12T21:44Z'));
    
            try 
            {
                await businessNetworkConnection.submitTransaction(transaction);
                console.log('Successfully created the AE101 flight');

                let transaction_a = factory.newTransaction(flightNamespace, aircraftTransaction);
                transaction_a.setPropertyValue('flightId','AE101-12-12-18');
                transaction_a.setPropertyValue('aircraftId', 'CRAFT001');

                try 
                {
                    await businessNetworkConnection.submitTransaction(transaction_a);
                    assert(true, 'Assign aircraft complete');
                } 
                catch(e) 
                {
                    assert(false, 'should dont have thrown an error');
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
    });

    it('FlightID does not exist', async () => {
        let transaction = factory.newTransaction(flightNamespace, aircraftTransaction);
        transaction.setPropertyValue('flightId','AE102-12-12-18');
        transaction.setPropertyValue('aircraftId', 'CRAFT001');

        try 
        {
            await businessNetworkConnection.submitTransaction(transaction);
            console.log('Assign aircraft complete');
        } 
        catch(e) 
        {
            console.log(e);
        }
    });

});