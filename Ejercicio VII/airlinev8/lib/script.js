/**
 * Create Flight Transaction
 * @param {org.acme.airline.flight.CreateFlight} flightData
 * @transaction
 **/

async function createFlight(flightData) 
{
    var timeNow, schedTime, flightRegistry, factory, NS, flightId, flight, route, event;
    
    timeNow = new Date().getTime();
    schedTime = new Date(flightData.schedule).getTime();

    if(schedTime < timeNow)
        throw new Error('Scheduled time cannot be in the past!!!');

    flightRegistry = await getAssetRegistry('org.acme.airline.flight.Flight');
    
    factory = getFactory();
    NS =  'org.acme.airline.flight';
            
    flightId = generateFlightId(flightData.flightNumber, flightData.schedule);
    flight = factory.newResource(NS, 'Flight', flightId);
    flight.flightNumber = flightData.flightNumber;
    flight.aliasFlightNumber = [];
            
    route = factory.newConcept(NS,'Route');
    route.origin = flightData.origin;
    route.destination = flightData.destination;
    route.schedule = flightData.schedule;

    flight.route = route;

    event = factory.newEvent(NS, 'FlightCreated');
    event.flightId = flightId;
    emit(event);

    await flightRegistry.add(flight);
}


function generateFlightId(flightNumber, schedule) 
{
    var dt, month, dayNum, year, flightId;

    dt = new Date(schedule);
    month = dt.getMonth() + 1;
    dayNum = dt.getDate();
    year = (dt.getFullYear() + '').substring(2,4);

    if((month + '').length == 1)  
        month = '0' + month;
    if((dayNum + '').length == 1)  
        dayNum = '0' + dayNum;
    
    flightId = flightNumber + '-' + month + '-' + dayNum + '-' + year;

    return flightId;
}