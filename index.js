const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const express = require('express')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000;
require('dotenv').config()


// middleware
app.use(cors());
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@srwebdev01.knsjdcd.mongodb.net/?retryWrites=true&w=majority&appName=srwebdev01`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobsCollection = client.db('careerCode').collection('jobs');
    const applicationCollection = client.db('careerCode').collection('applications');

    // view applications
    app.get('/applications/job/:job_id', async(req, res) =>{
      const job_id = req.params.job_id;
      const query = { jobId: job_id}
      const result = await applicationCollection.find(query).toArray();
      res.send(result);
    })
    // ViewApplications data
    app.patch('/applications/:id', async(req, res) =>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)}
      const updatedDoc = {
        $set: {
          status: req.body.status
        }
      }
      const result = await applicationCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })

    // job applications related aPIs
    app.post('/applications', async(req, res) => {
      const application = req.body;
      console.log(application);
      const result = await applicationCollection.insertOne(application);
      res.send(result)
    })
// 
    app.post('/jobs', async(req, res) =>{
      const newJob = req.body;
      console.log(newJob);
      const result = await jobsCollection.insertOne(newJob);
      res.send(result);
    })

    // job application list data collect
    app.get('/applications', async(req, res) => {
      const email = req.query.email;

      const query = {
        applicant: email
      }
      const result = await applicationCollection.find(query).toArray()

      // bad way to aggregate data
      for(const application of result){
        const jobId = application.jobId;
        const jobQuery = { _id: new ObjectId(jobId)}
        const job = await jobsCollection.findOne(jobQuery);
        application.company = job.company
        application.title = job.title
        application.company_logo = job.company_logo
      }
      res.send(result)
    })

    // jobs api 
    app.get('/jobs', async(req, res) =>{

      const email = req.query.email;
      const query = {};
      if (email) {
        query.hr_email = email;
      }
        const cursor = jobsCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    app.get('/jobs/applications', async(req, res) =>{
      const email = req.query.email;
      const query = { hr_email: email}
      const jobs = await jobsCollection.find(query).toArray();

      // should use aggregate to have optimum data fetching
      for(const job of jobs) {
        const applicationQuery = { jobId: job._id.toString()}
        const application_count = await applicationCollection.countDocuments(applicationQuery)
        job.application_count = application_count;
        res.send(jobs);
      }

    })

    // ? could be done but should not be done
    // app.get('/jobsBYEmailAddress', async(req, res) =>{
    //   const email = req.query.email;
    //   const query = { hr_email: email }
    //   const result = await jobsCollection.find(query).toArray()
    //   res.send(result);
    // })


    // single job get for apply btn
    app.get('/jobs/:id', async(req, res) =>{
        const id = req.params.id;
        const query = { _id: new ObjectId(id)}
        const result = await jobsCollection.findOne(query);
        res.send(result)
    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) =>{
    res.send('Career code is Cooking')
})

app.listen(port, () =>{
    console.log(`Career Code server Is running on port ${port}`);
})