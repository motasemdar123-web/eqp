
'use client';

import { useEffect, useState } from 'react';

export default function ReportsPage() {

    const [reports, setReports] = useState([]);

    const [loading, setLoading] = useState(true);

    const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL;

    useEffect(() => {

        loadReports();

    }, []);

    async function loadReports() {

        try {

            const response = await fetch(

                `${backendUrl}/reports`
            );

            const data = await response.json();

            setReports(data);

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    async function deleteReport(id) {

        const confirmed =
            confirm('Delete this report?');

        if (!confirmed) return;

        try {

            await fetch(

                `${backendUrl}/reports/${id}`,

                {
                    method: 'DELETE'
                }

            );

            loadReports();

        } catch (error) {

            console.error(error);

        }

    }

    async function renameReport(id, oldName) {

        const newName =
            prompt('New report name:', oldName);

        if (!newName) return;

        try {

            await fetch(

                `${backendUrl}/reports/${id}`,

                {

                    method: 'PUT',

                    headers: {

                        'Content-Type':
                        'application/json'

                    },

                    body: JSON.stringify({

                        report_name: newName

                    })

                }

            );

            loadReports();

        } catch (error) {

            console.error(error);

        }

    }

    return (

        <div className="min-h-screen bg-black p-10 text-white">

            <h1 className="mb-8 text-4xl font-black text-yellow-500">

                Reports

            </h1>

            {loading ? (

                <p>Loading...</p>

            ) : (

                <div className="overflow-x-auto rounded-3xl border border-zinc-800">

                    <table className="w-full">

                        <thead className="bg-zinc-900">

                            <tr>

                                <th className="p-5 text-left">
                                    Report
                                </th>

                                <th className="p-5 text-left">
                                    Created
                                </th>

                                <th className="p-5 text-left">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {reports.map((report) => (

                                <tr
                                    key={report.id}
                                    className="border-t border-zinc-800"
                                >

                                    <td className="p-5">

                                        {report.report_name}

                                    </td>

                                    <td className="p-5">

                                        {

                                            new Date(
                                                report.created_at
                                            ).toLocaleString()

                                        }

                                    </td>

                                    <td className="flex gap-3 p-5">

                                        <a
                                            href={report.file_url}
                                            target="_blank"
                                            className="rounded-xl bg-yellow-500 px-4 py-2 font-bold text-black"
                                        >

                                            Download

                                        </a>

                                        <button
                                            onClick={() =>
                                                renameReport(

                                                    report.id,

                                                    report.report_name
                                                )
                                            }
                                            className="rounded-xl bg-zinc-700 px-4 py-2"
                                        >

                                            Rename

                                        </button>

                                        <button
                                            onClick={() =>
                                                deleteReport(report.id)
                                            }
                                            className="rounded-xl bg-red-600 px-4 py-2"
                                        >

                                            Delete

                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            )}

        </div>

    );

}
