# AWS Daily Charge Monitor

A serverless function to check your daily cost on AWS using the Cost Explorer API. You can configure your daily threshold within `index.js` by setting `ALERTING_THRESHOLD` constant. You can also swap out the `console.error` calls with any monitoring/alerting tool you like.


We have also provided an example `serverless.yml` file which sets up the correct IAM permissions and runs the function at 10AM every day. 

P.S: Each API call to Cost Explorer service costs $0.01 itself.

P.S: `sample.md` file contains a sample output record from AWS.
