
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Client } = require('pg');

const ExcelJS = require('exceljs');
const fs = require('fs-extra');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// =========================
// PostgreSQL Connection
// =========================

const client = new Client({

    user:
        process.env.DB_USER,

    host:
        process.env.DB_HOST,

    database:
        process.env.DB_NAME,

    password:
        process.env.DB_PASSWORD,

    port:
        process.env.DB_PORT,

    ssl: {
        rejectUnauthorized: false
    }

});

client.connect()
    .then(() => {

        console.log(
            'Connected to PostgreSQL'
        );

    })
    .catch(console.error);

// =========================
// Test Route
// =========================

app.get('/', (req, res) => {

    res.json({
        message: 'EQP Backend Running'
    });

});

// =========================
// Load Machines Route
// =========================

const { createClient } =

require('@supabase/supabase-js');

const supabase =

createClient(

    process.env.SUPABASE_URL,

    process.env.SUPABASE_SERVICE_ROLE_KEY

);



app.get('/machines', async (req, res) => {

    try {

        const machinesResult =
            await client.query(`
                SELECT *
                FROM machines
                ORDER BY machine_number
            `);

        res.json({

            success: true,

            machines:
                machinesResult.rows

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            error: error.message

        });
    }
});

// =========================
// Verify User Route
// =========================

app.post('/verify-user', async (req, res) => {

    try {

        const { userNumber } =
            req.body;

        const result =
            await client.query(`
                SELECT *
                FROM users
                WHERE user_number = $1
            `, [userNumber]);

        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,
                error: 'Invalid user code'

            });
        }

        const user =
            result.rows[0];

        res.json({

            success: true,

            user: {

                id:
                    user.id,

                userNumber:
                    user.user_number,

                fullName:
                    user.full_name

            }

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            error: error.message

        });
    }
});

// =========================
// Generate Reports Route
// =========================

app.post('/generate-reports', async (req, res) => {

    try {

    

const {

    userNumber,

    reportType,

    serviceType,

    selectedMachines,

    reportDates

} = req.body;


        // =========================
        // Load User
        // =========================

        const userResult =
            await client.query(`
                SELECT *
                FROM users
                WHERE user_number = $1
            `, [userNumber]);

        if (
            userResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,
                error: 'User not found'

            });
        }

        const user =
            userResult.rows[0];

        const userName =
            user.full_name;

        // =========================
        // Load Machines
        // =========================

       
const machinesResult =
    await client.query(`

        SELECT *

        FROM machines

        WHERE id = ANY($1)

        ORDER BY machine_number

    `, [selectedMachines]);



        const machines =
            machinesResult.rows;
            
const totalMachines =
    machines.length;


        // =========================
        // Load Comments
        // =========================

        const commentsResult =
            await client.query(`
                SELECT *
                FROM report_comments
            `);

        const comments =
            commentsResult.rows;

        // =========================
        // Output Folder
        // =========================

        const outputFolder =
            path.join(
                __dirname,
                'output'
            );

        await fs.ensureDir(
            outputFolder
        );

        // =========================
        // Time
        // =========================

        const now = new Date();

        const hh =
            String(
                now.getHours()
            ).padStart(2, '0');

        const mm =
            String(
                now.getMinutes()
            ).padStart(2, '0');

        

        // =========================
        // Random Comment Helper
        // =========================

        function randomComment() {

            const pool = [];

            comments.forEach(comment => {

                for (
                    let i = 0;
                    i < comment.frequency;
                    i++
                ) {

                    pool.push(
                        comment.comment_text
                    );
                }

            });

            return pool[
                Math.floor(
                    Math.random() *
                    pool.length
                )
            ];
        }

        // =========================
        // Generated Files
        // =========================

        const generatedFiles = [];

        let reportIndex = 1;

        // =========================
        // Process Machines
        // =========================
        

        for (const machine of machines) {
            
            let currentSMR =
                Number(machine.last_smr);

            let currentStep =
                Number(machine.smr_step);
            
            let currentCounter =
                Number(machine.report_counter);
            for (const serviceDate of reportDates) { 
        
const safeDate =

    serviceDate
        .replace(/-/g, '');



            // =========================
            // Current Values
            // =========================



            // =========================
            // Increase Step
            // =========================

            currentStep++;
           
            currentCounter++;


            // =========================
            // Increase SMR Every 4 Reports
            // =========================

            if (
                currentStep >= 4
            ) {

                currentSMR += 1;

                currentStep = 0;
            }

         
// =========================
// Load Template
// =========================

const workbook =
    new ExcelJS.Workbook();

// =========================
// Dynamic Template Name
// =========================

const safeServiceType =

    serviceType
        .replace(/\./g, '')
        .replace(/\s+/g, '_');

const templateFile =

    `${reportType}_${safeServiceType}.xlsx`;

const templatePath =

    path.join(

        __dirname,
        'templates',
        templateFile

    );

// =========================
// Load Selected Template
// =========================

await workbook.xlsx.readFile(
    templatePath
);

            const sheet =
                workbook.worksheets[0];

            // =========================
            // Report Number
            // =========================

            const reportNo =
                `${safeDate}-${hh}${mm}-${String(reportIndex).padStart(3, '0')}`;

            // =========================
            // Random Values
            // =========================

            const lowIdle =
                Math.floor(
                    Math.random() * (800 - 750 + 1)
                ) + 750;

            const highIdle =
                Math.floor(
                    Math.random() * (2110 - 2050 + 1)
                ) + 2050;

            // =========================
            // Random Comment
            // =========================

            const selectedComment =
                randomComment();

            // =========================
            // Random Comment Cell
            // =========================

            const columnsField = [

                'K','L','M','N','O',
                'P','Q','R','S','T',
                'U','V','W','X','Y','Z'

            ];

            const rowsField = [
                77,
                78,
                79
            ];

            const randomColumn =
                columnsField[
                    Math.floor(
                        Math.random() *
                        columnsField.length
                    )
                ];

            const randomRow =
                rowsField[
                    Math.floor(
                        Math.random() *
                        rowsField.length
                    )
                ];

            const commentCell =
                `${randomColumn}${randomRow}`;

            // =========================
            // Fill Template
            // =========================

            sheet.getCell('L9').value =
                machine.machine_number;

            sheet.getCell('AD9').value =
                machine.engine_number;

            sheet.getCell('AN1').value =
                reportNo;

            
const formattedDate =

    new Date(serviceDate)
        .toLocaleDateString(

            'en-US',

            {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
            }

        );

sheet.getCell('B13').value =
    formattedDate;

            sheet.getCell('L13').value =
                currentSMR;

            sheet.getCell('AP4').value =
                userName;

            sheet.getCell('AX43').value =
                lowIdle;

            sheet.getCell('AX44').value =
                highIdle;

            // =========================
            // Inspector Comment
            // =========================

            sheet.getCell(commentCell).value =
                selectedComment;




// =========================
// SIGNATURE
// =========================

const signatureName =

    user.full_name
        .split(' ')[0]
        .toLowerCase();

const signaturePath =

    path.join(

        __dirname,
        'signatures',
        `${signatureName}-signature.png`

    );

// =========================
// CHECK SIGNATURE EXISTS
// =========================

if (fs.existsSync(signaturePath)) {

    const signatureImage =

        workbook.addImage({

            filename: signaturePath,
            extension: 'png'

        });

    // =========================
    // INSERT SIGNATURE
    // =========================

    sheet.addImage(

        signatureImage,

        {

            tl: {
                col: 48,
                row: 78
            },

            ext: {
                width: 140,
                height: 60
            }

        }

    );

    console.log(
        `Signature added for ${signatureName}`
    );

} else {

    console.log(
        `Signature not found: ${signaturePath}`
    );
}

       
            // =========================
            // File Name
            // =========================

            const fileName =

                `${machine.machine_type} ${machine.machine_number} ex${currentCounter}.xlsx`;

            const filePath =
                path.join(
                    outputFolder,
                    fileName
                );

            // =========================
            // Save File
            // =========================

         
const buffer =

    await workbook.xlsx.writeBuffer();

const {

    data: uploadData,

    error: uploadError

} =

await supabase.storage
    .from('reports')
    .upload(

        fileName,

        buffer,

        {

            contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

            upsert: true

        }

    );

if (uploadError) {

    throw uploadError;
}



const {

    data: fileData

} =

supabase.storage
    .from('reports')
    .getPublicUrl(fileName);

const fileUrl =

    fileData.publicUrl;



            // =========================
            // Save Report
            // =========================

            await client.query(`
                INSERT INTO reports
                (
                    report_no,
                    machine_type,
                    machine_id,
                    engine_number,
                    smr,
                    service_date,
                    comments,
                    created_by,
                    machine_number,
                    report_type,
                    service_type,
                    file_name,
                    file_url
                )
                VALUES
                (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
                )
            `, [

                reportNo,
                machine.machine_type,
                machine.id,
                machine.engine_number,
                currentSMR,
                serviceDate,
                selectedComment,
                userName,
                machine.machine_number,
                reportType,
                serviceType,
                fileName,
                fileUrl

            ]);

            // =========================
            // Update Machine
            // =========================

            await client.query(`
                UPDATE machines
                SET
                    last_smr = $1,
                    smr_step = $2,
                    report_counter = $3
                WHERE id = $4
            `, [

                currentSMR,
                currentStep,
                currentCounter,
                Number(machine.id)

            ]);

            generatedFiles.push({

                machine:
                    machine.machine_number,

                report:
                    reportNo,

                file:
                    fileName

            });

            reportIndex++;

        }

    }

    // =========================
    // Response
    // =========================

    res.json({

        success: true,

        totalMachines,

        generatedFiles

    });

} catch (error) {

    console.error(error);

    res.status(500).json({

        success: false,
        error: error.message

    });
}

});



// =========================
// Start Server

// =========================

app.get('/machine-history', async (req, res) => {

    try {

        const result =

            await client.query(`

                SELECT
                    mh.*,
                    m.machine_number,
                    m.machine_type

                FROM machine_history mh

                JOIN machines m
                ON mh.machine_id = m.id

                ORDER BY mh.created_at DESC

            `);

        res.json({

            success: true,

            history: result.rows

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            error: error.message

        });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log(
        `Server running on port ${PORT}`
    );

});

