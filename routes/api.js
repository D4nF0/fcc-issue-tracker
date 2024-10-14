'use strict';

const mongoose = require('mongoose');
mongoose.connect( process.env.MONGO_URI ).then( () => {
  console.log( 'Connected to MongoDB' );
}).catch((err) => {
  console.log(err);
});

const Schema = mongoose.Schema;
const issueSchema = new Schema({
  issue_title: String,
  issue_text: String,
  created_on: Date,
  updated_on: Date,
  created_by: String,
  assigned_to: String,
  open: {
    type: Boolean,
    default: true,
  },
  status_text: String,
});
const IssueModel = mongoose.model( 'issue', issueSchema );

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      const project = req.params.project;
      const query /*{ _id, issue_text, created_on, updated_on, created_by, assigned_to, status_text }*/ = req.query;

      let filter = {
        issue_title: project      
      };

      for ( const spec in query ) {
        if ( !/.*vscode.+/.test( spec ) ) filter[ spec ] = query[ spec ];
      };

      /*
      if ( _id ) filter._id = _id;
      if ( issue_text ) filter.issue_text = issue_text;
      if ( created_on ) filter.created_on = created_on;
      if ( updated_on ) filter.updated_on = updated_on;
      if ( created_by ) filter.created_by = created_by;
      if ( assigned_to ) filter.assigned_to = assigned_to;
      if ( open ) filter.open = open;
      if ( status_text ) filter.status_text = status_text;
      */

      IssueModel.find( filter ).then( ( issueData ) => {
        if( !issueData ) {
          res.send("Could not find the project");
          return;
        } else {
          const issues = issueData.map( e => {
            return {
              _id: e._id,
              issue_title: e.issue_title,
              issue_text: e.issue_text,
              created_on: e.created_on,
              updated_on: e.updated_on,
              created_by: e.created_by,
              assigned_to: e.assigned_to,
              open: e.open,
              status_text: e.status_text
            };
          });

          res.json( issues );
        };
      }).catch(( err ) => {
        console.log( err );
        res.send('Error has occured');
      });
    })

    .post(function (req, res){
      const body /*{ issue_text, created_by, assigned_to, status_text }*/ = req.body;
      const date = new Date();

      let newIssue = new IssueModel( {
        issue_title: body.issue_title,
        issue_text: body.issue_text,
        created_on: date,
        updated_on: date,
        created_by: body.created_by,
        assigned_to: body.assigned_to,
        status_text: body.status_text,
      });

      newIssue.save().then(( issueData ) => {
        res.json({
          assigned_to: issueData.assigned_to,
          status_text: issueData.status_text,
          open: issueData.open,
          _id: issueData._id,
          issue_title: issueData.issue_title,
          issue_text: issueData.issue_text,
          created_by: issueData.created_by,
          created_on: issueData.created_on,
          updated_on: issueData.updated_on,
        });
        console.log("Issue has been saved");
      }).catch(( err ) => {
        console.log( err );
        res.send('Error has occured');
      });
    })
    
    .put(function (req, res){
      const body /*{ _id, issue_title, issue_text, created_by, assigned_to, status_text, open }*/ = req.body;

      let updates = {
        updated_on: new Date(),
      };

      for ( const spec in body ) {
        if ( body[ spec ] && !/_id+/.test( spec ) ) updates[ spec ] = body[ spec ];
      };

      IssueModel.findOneAndUpdate( 
        { _id: body._id },
        updates,
        { new: true }
      ).then( ( issueData ) => {
        if( issueData ){
          res.json({
            result: "successfully updated",
            _id: body._id
          });
          console.log("Issue has been updated");
        }
      }).catch((err) => {
        console.log(err);
        res.json({
          error: "could not update",
          _id: body._id
        })
      });
    })
    
    .delete(function (req, res){
      const body /*{ _id }*/ = req.body;
      
      IssueModel.findByIdAndDelete( { _id: body._id } ).then(( issueData ) => {
        if( issueData ){
          res.json({
            result: "successfully deleted",
            _id: body._id
          })
          console.log("Issue has been deleted");
        }
      }).catch((err) => {
        console.log( err );
        res.send('Error has occured');
      });
    });
};