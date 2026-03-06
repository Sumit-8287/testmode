import dns from 'dns';
const srvRecord = '_mongodb._tcp.cluster0.yvihcjy.mongodb.net';
dns.resolveSrv(srvRecord, (err, addresses) => {
    if (err) {
        console.error('DNS Error:', err);
        return;
    }
    console.log('Resolved Addresses:', JSON.stringify(addresses, null, 2));
});
