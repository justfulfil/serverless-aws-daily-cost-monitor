const get = require("lodash/get");
const moment = require("moment");
const { CostExplorer } = require("aws-sdk");

const getCostsPromisified = ({ ce, startDate, endDate }) => {
  return new Promise((resolve, reject) => {
    return ce.getCostAndUsage(
      {
        TimePeriod: {
          Start: startDate,
          End: endDate
        },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
        Filter: {
          Not: {
            Dimensions: {
              Key: "RECORD_TYPE",
              Values: ["Credit", "Refund", "Tax"]
            }
          }
        }
      },
      (error, data) => {
        if (error) {
          reject(error);
        }
        resolve(data);
      }
    );
  });
};

const monitorAWSCosts = async () => {
  const AWS_CE_DATE_FORMAT = "YYYY-MM-DD";
  const TWO_DAYS_AGO = moment
    .utc()
    .subtract(2, "days")
    .format(AWS_CE_DATE_FORMAT);
  const TODAY = moment.utc().format(AWS_CE_DATE_FORMAT);
  const ALERTING_THRESHOLD = 10; // $10 a day
  /*
    The start date is inclusive, but the end date is exclusive. 
    For example, if start is 2017-01-01 and end is 2017-05-01, 
    then the cost and usage data is retrieved from 2017-01-01 up to and including 2017-04-30 
    but not including 2017-05-01.
  */
  try {
    const ce = new CostExplorer({
      apiVersion: "2017-10-25",
      // The Cost Explorer API provides the following endpoint
      endpoint: "https://ce.us-east-1.amazonaws.com"
    });

    const results = await getCostsPromisified({
      ce,
      startDate: TWO_DAYS_AGO,
      endDate: TODAY
    });

    const yesterdaysBill = get(
      results,
      "ResultsByTime[0].Total.UnblendedCost.Amount"
    );
    const yesterdayDate = get(results, "ResultsByTime[0].TimePeriod.Start");
    if (!yesterdaysBill) {
      console.error(
        "No charge record found. Check AWS Cost Explorer Portal instead"
      );
      return;
    }

    const bill = Number(yesterdaysBill);
    if (bill > ALERTING_THRESHOLD) {
      console.error(
        `AWS Daily Charge of $${bill} on ${yesterdayDate} is higher than ${ALERTING_THRESHOLD}. Please investigate.`
      );
    }
  } catch (err) {
    console.error(err);
  }
};

exports.monitorAWSCosts = monitorAWSCosts;
