import { Types } from "mongoose";

export const recordSummaryPipeline = (
    recordId: Types.ObjectId
) => [
    {
        $match: {
            recordId,
        },
    },
    {
        $group: {
            _id: null,
            totalCashIn: {
                $sum: {
                    $cond: [
                        { $eq: ["$type", "cashIn"] },
                        "$amount",
                        0,
                    ],
                },
            },
            totalCashOut: {
                $sum: {
                    $cond: [
                        { $eq: ["$type", "cashOut"] },
                        "$amount",
                        0,
                    ],
                },
            },
            totalTransactions: {
                $sum: 1,
            },
        },
    },
    {
        $project: {
            _id: 0,
            totalCashIn: 1,
            totalCashOut: 1,
            totalTransactions: 1,
            currentBalance: {
                $subtract: [
                    "$totalCashIn",
                    "$totalCashOut",
                ],
            },
        },
    },
];