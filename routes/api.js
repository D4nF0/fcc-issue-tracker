'use strict';

const mongoose = require('mongoose');
mongoose.connect( process.env.MONGO_URI ).then( () => {
  console.log( 'Connected to MongoDB' );
}).catch((err) => {
  console.log(err);
});
const objectId = require('mongodb').ObjectId;

const Schema = mongoose.Schema;
const issueSchema = new Schema({
  issue_title: {
    type: String,
    required: true
  },
  issue_text:  {
    type: String,
    required: true
  },
  created_on: Date,
  updated_on: Date,
  created_by:  {
    type: String,
    required: true
  },
  assigned_to: {
    type: String,
    default: ""
  },
  open: {
    type: Boolean,
    default: true,
  },
  status_text:  {
    type: String,
    default: ""
  },
}, { versionKey: false });
const IssueModel = mongoose.model( 'issue', issueSchema );

const projectSchema = new Schema({
  name: String,
  issues: [issueSchema]
});
const ProjectModel = mongoose.model( 'project', projectSchema );

module.exports = function (app) {
  app.route('/api/issues/:project')

  .get( ( req, res ) => {
    const project = req.params.project;

    /*{ _id, issue_title, issue_text, created_on, updated_on, created_by, assigned_to, open, status_text }*/ 
    const {
      _id, 
      issue_title,
      issue_text,
      created_by,
      assigned_to,
      open,
      status_text
    } = req.query;

    ProjectModel.aggregate([
      { $match: { name: project } },
      { $unwind: "$issues" },
      _id != undefined ? { $match: { "issues._id": new objectId(_id) } } : { $match: {} },
      issue_title != undefined ? { $match: { "issues.issue_title": issue_title } } : { $match: {} },
      issue_text != undefined ? { $match: { "issues.issue_text": issue_text } } : { $match: {} },
      created_by != undefined ? { $match: { "issues.created_by": created_by } } : { $match: {} },
      assigned_to != undefined ? { $match: { "issues.assigned_to": assigned_to } } : { $match: {} },
      open != undefined ? { $match: { "issues.open": open } } : { $match: {} },
      status_text != undefined ? { $match: { "issues.status_text": status_text } } : { $match: {} }
    ]).exec().then(( aggregationData ) => {
      if( !aggregationData ){
        res.json([]);
      } else {
        const mappedData = aggregationData.map( e => e.issues )
        res.json( mappedData );
      }
    });

  })

  .post( ( req, res ) => {
    const project = req.params.project;

    /*{ issue_title, issue_text, created_by, assigned_to, status_text }*/ 
    const body = req.body;
    if( !body.issue_title || !body.issue_text || !body.created_by ){
      res.send({ error: 'required field(s) missing' });
      return;
    }

    const newIssue = new IssueModel({
      issue_title: body.issue_title || "", 
      issue_text: body.issue_text || "",
      created_on: new Date(),
      updated_on: new Date(),
      created_by: body.created_by || "",
      assigned_to: body.assigned_to || "",
      status_text: body.status_text || "",
    });

    ProjectModel.findOne({ name: project }).then(( projectData ) => {
      if( !projectData ){
        const newProject = new ProjectModel({ name: project });
        newProject.issues.push( newIssue );
        newProject.save().then(( data ) => {
          if( !data ){
            res.send("An error has occured");
          } else {
            res.json( newIssue );
          };
        });
      } else {
        projectData.issues.push( newIssue );
        projectData.save().then(( data ) => {
          if( !data ){
            res.send("An error has occured");
          } else {
            res.json( newIssue );
          };
        });
      };
    });

  })

  .put( ( req, res ) => {
    const project = req.params.project;

    /*{ _id, issue_title, issue_text, created_by, assigned_to, status_text, open }*/
    const body = req.body;
    if( !body._id ){
      res.send({ error: "missing _id" });
      return;
    }

    let updates = {
      updated_on: new Date(),
    };
    for ( const spec in body ) {
      if ( body[ spec ] && !/_id+/.test( spec ) ) updates[ spec ] = body[ spec ];
    };
    if( Object.keys( updates ).length == 1 ){
      res.send({ error: 'no update field(s) sent', '_id': body._id });
      return;
    };

    ProjectModel.findOne({ name: project }).then(( projectData ) => {
      if( !projectData ){
        res.send({ error: 'could not update', '_id': body._id });
      } else {
        const issueData = projectData.issues.id( body._id );
        if( !issueData ){
          res.send({ error: 'could not update', '_id': body._id });
          return;
        };

        issueData.issue_title = body.issue_title || issueData.issue_title;
        issueData.issue_text = body.issue_text || issueData.issue_text;
        issueData.created_by = body.created_by || issueData.created_by;
        issueData.assigned_to = body.assigned_to || issueData.assigned_to;
        issueData.status_text = body.status_text || issueData.status_text;
        issueData.updated_on = new Date();
        issueData.open = body.open;

        projectData.save().then(( savedData ) => {
          if( !savedData ){
            res.send({ error: 'could not update', '_id': body._id });
          } else {
            res.send({ result: 'successfully updated', '_id': body._id });
          };
        });
      };
    });

  })

  .delete( ( req, res ) => {
    const project = req.params.project;
    const { _id } = req.body;

    if( !_id ){
      res.send({ error: "missing _id" });
      return;
    }

    ProjectModel.findOne({ name: project }).then(( projectData ) => {
      if( !projectData ){
        res.send({ error: 'could not delete', '_id': _id });
      } else {
        const issueData = projectData.issues.id( _id );
        if( !issueData ){
          res.send({ error: 'could not delete', '_id': _id });
          return;
        };

        issueData.deleteOne();

        projectData.save().then(( savedData ) => {
          if( !savedData ){
            res.send({ error: 'could not delete', '_id': _id });
          } else {
            res.send({ result: 'successfully deleted', '_id': _id });
          };
        });
      };
    });

  });

};