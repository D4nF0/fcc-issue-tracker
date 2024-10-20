const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let deleteId;

describe('Functional Tests', () => {
    it('POST request - every field', ( done ) => {
        chai
        .request( server )
        .post('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            issue_title: "functionalTest",
            issue_text: "Functional test - POST request - every field",
            created_by: "test user",
            assigned_to: "test user",
            status_text: "IN QA",
        })
        .then(( res ) => {
            deleteId = res.body._id;
            assert.equal( res.status, 200 );
            assert.equal( res.body.issue_title, 'functionalTest' );
            assert.equal( res.body.issue_text, 'Functional test - POST request - every field' );
            assert.equal( res.body.created_by, 'test user' );
            assert.equal( res.body.assigned_to, 'test user' );
            assert.equal( res.body.status_text, 'IN QA' );
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it('POST request - required fields', ( done ) => {
        chai
        .request( server )
        .post('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            issue_title: "functionalTest",
            issue_text: "Functional test - POST request - required field",
            created_by: "test user",
            assigned_to: "",
            status_text: "",
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.issue_title, 'functionalTest' );
            assert.equal( res.body.issue_text, 'Functional test - POST request - required field' );
            assert.equal( res.body.created_by, 'test user' );
            assert.equal( res.body.assigned_to, '' );
            assert.equal( res.body.status_text, '' );
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it('POST request - missing required fields', ( done ) => {
        chai
        .request( server )
        .post('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            issue_title: "",
            issue_text: "",
            created_by: "",
            assigned_to: "test user",
            status_text: "IN QA",
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.error, 'required field(s) missing')
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it('GET request - no filters', ( done ) => {
        chai
        .request( server )
        .get('/api/issues/functionalTest')
        .end(( err, res ) => {
            if( err ) console.log( err );

            const filtered = res.body.filter( ( element ) => element.issue_title == 'functionalTest');
            assert.equal( res.status, 200 );
            assert.equal( res.body.length, filtered.length );
            done();
        });
    });

    it('GET request - one filter', ( done ) => {
        chai
        .request( server )
        .get('/api/issues/functionalTest')
        .query({
            open: true
        })
        .end(( err, res ) => {
            if( err ) console.log( err );

            const filtered = res.body.map( ( element ) => {
                if(element.issue_title == 'functionalTest' && element.open == true){
                    return element;
                }
            });
            assert.equal( res.status, 200 );
            assert.equal( res.body.length, filtered.length );
            done();
        });
    });
    
    it('GET request - multiple filters', ( done ) => {
        chai
        .request( server )
        .get('/api/issues/functionalTest')
        .query({
            open: true,
            status_text: "IN QA",
        })
        .end(( err, res ) => {
            if( err ) console.log( err );

            const filtered = res.body.map( ( element ) => {
                if(element.issue_title == 'functionalTest' && element.open == true && element.status_text == "IN QA"){
                    return element;
                }
            });
            assert.equal( res.status, 200 );
            assert.equal( res.body.length, filtered.length );
            done();
        });
    });

    it("PUT request - one field", ( done ) => {
        chai
        .request( server )
        .put('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            _id: deleteId,
            issue_text: 'PUT request change',
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.result, "successfully updated")
            assert.equal( res.body._id, deleteId)
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it("PUT request - multiple fields", ( done ) => {
        chai
        .request( server )
        .put('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            _id: deleteId,
            issue_text: 'PUT request change',
            status_text: "Changed"
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.result, "successfully updated")
            assert.equal( res.body._id, deleteId)
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it("PUT request - missing _id update", ( done ) => {
        chai
        .request( server )
        .put('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({})
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.error, 'missing _id')
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it("PUT request - no fields to update", ( done ) => {
        chai
        .request( server )
        .put('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            _id: deleteId
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.error, 'no update field(s) sent')
            assert.equal( res.body._id, deleteId)
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it("PUT request - invalid _id update", ( done ) => {
        chai
        .request( server )
        .put('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            _id: "5712b4b6c61ba86225f9de8d",
            issue_text: "invalid _id"
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.error, "could not update")
            assert.equal( res.body._id, "5712b4b6c61ba86225f9de8d")

            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it("DELETE request - deleting issue", ( done ) => {
        chai
        .request( server )
        .delete('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            _id: deleteId,
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.result, "successfully deleted")
            assert.equal( res.body._id, deleteId)
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it("DELETE request - invalid _id", ( done ) => {
        chai
        .request( server )
        .delete('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({
            _id: deleteId,
        })
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.error, "could not delete")
            assert.equal( res.body._id, deleteId)
            done();
        })
        .catch(( err ) => console.log( err ));
    });

    it("DELETE request - missing _id", ( done ) => {
        chai
        .request( server )
        .delete('/api/issues/functionalTest')
        .set("content-type", "application/json")
        .send({})
        .then(( res ) => {
            assert.equal( res.status, 200 );
            assert.equal( res.body.error, 'missing _id')
            done();
        })
        .catch(( err ) => console.log( err ));
    });
});