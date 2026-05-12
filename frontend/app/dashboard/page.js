
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {

    const router = useRouter();

    // =========================
    // STATES
    // =========================

    const [activePage, setActivePage] =
        useState('dashboard');

    const [isGenerating, setIsGenerating] =
        useState(false);

    const [reportCount, setReportCount] =
        useState('');

    const [showDatesModal, setShowDatesModal] =
        useState(false);

    const [reportDates, setReportDates] =
        useState([]);

    const [machineHistory, setMachineHistory] =
        useState([]);

    const [machines, setMachines] =
        useState([]);

    const [selectedMachines, setSelectedMachines] =
        useState([]);

    const [userCode, setUserCode] =
        useState('');

    const [reportType, setReportType] =
        useState('W30');

    const [serviceType, setServiceType] =
        useState('1st Service');

    const [searchTerm, setSearchTerm] =
        useState('');

    const [filterType, setFilterType] =
        useState('ALL');

    const [filterEngineer, setFilterEngineer] =
        useState('ALL');

    const [showOnlySelected, setShowOnlySelected] =
        useState(false);

    // =========================
    // AUTH
    // =========================

    useEffect(() => {

        const storedUser =
            localStorage.getItem('user');

        if (!storedUser) {

            router.push('/');
            return;
        }

        const parsedUser =
            JSON.parse(storedUser);

        setUserCode(
            parsedUser.userNumber
        );

        loadMachines();
        loadMachineHistory();

    }, []);

    // =========================
    // LOAD MACHINES
    // =========================

    async function loadMachines() {

        try {

            const response =
                await fetch(
                    'https://eqp.onrender.com/machines'
                );

            const data =
                await response.json();

            setMachines(
                data.machines || []
            );

        } catch (error) {

            console.error(error);
        }
    }

    // =========================
    // LOAD HISTORY
    // =========================

async function loadMachineHistory() {

    try {

        const response =

            await fetch(
                'https://eqp.onrender.com/machine-history'
            );

        const text =
            await response.text();

        console.log(text);

        const data =
            JSON.parse(text);

        setMachineHistory(
            data.history || []
        );

    } catch (error) {

        console.error(error);
    }
}

    // =========================
    // TOGGLE MACHINE
    // =========================

    function toggleMachine(machineId) {

        setSelectedMachines(prev => {

            if (prev.includes(machineId)) {

                return prev.filter(
                    id => id !== machineId
                );
            }

            return [
                ...prev,
                machineId
            ];
        });
    }

    // =========================
    // FILTERED MACHINES
    // =========================

    const filteredMachines =

        machines.filter(machine => {

            const matchesSearch =

                machine.machine_number
                    ?.toString()
                    .includes(searchTerm)

                ||

                machine.engine_number
                    ?.toString()
                    .includes(searchTerm);

            const matchesType =

                filterType === 'ALL'
                ||
                machine.machine_type === filterType;

            const matchesEngineer =

                filterEngineer === 'ALL'
                ||
                machine.responsible_engineer === filterEngineer;

            const matchesSelected =

                !showOnlySelected
                ||
                selectedMachines.includes(machine.id);

            return (

                matchesSearch
                &&
                matchesType
                &&
                matchesEngineer
                &&
                matchesSelected
            );
        });

    // =========================
    // SELECT ALL
    // =========================

    function toggleSelectAll() {

        if (

            selectedMachines.length ===
            filteredMachines.length

        ) {

            setSelectedMachines([]);

        } else {

            setSelectedMachines(

                filteredMachines.map(
                    machine => machine.id
                )
            );
        }
    }

    // =========================
    // GENERATE REPORTS
    // =========================

    async function generateReports() {

        if (selectedMachines.length === 0) {

            alert(
                'Please select at least one machine'
            );

            return;
        }

        const count =
            parseInt(reportCount);

        if (
            isNaN(count)
            ||
            count <= 0
        ) {

            alert(
                'Please enter valid reports count'
            );

            return;
        }

        const datesArray =

            Array(count)
                .fill('');

        setReportDates(
            datesArray
        );

        setShowDatesModal(true);
    }

    // =========================
    // SUBMIT REPORTS
    // =========================

    async function submitMultipleReports() {

        if (

            reportDates.some(
                date => !date
            )

        ) {

            alert(
                'Please fill all dates'
            );

            return;
        }

        try {

            setIsGenerating(true);

            const response =

                await fetch(

                    'https://eqp.onrender.com/generate-reports',

                    {

                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body: JSON.stringify({

                            userNumber:
                                Number(userCode),

                            reportType,

                            serviceType,

                            selectedMachines,

                            reportDates

                        })
                    }
                );

            const data =
                await response.json();

            if (data.success) {

                alert(

                    `Generated ${data.generatedFiles.length} reports`

                );

                setShowDatesModal(false);

                setSelectedMachines([]);

                await loadMachines();
                await loadMachineHistory();
            }

        } catch (error) {

            console.error(error);

            alert(
                'Something went wrong'
            );

        } finally {

            setIsGenerating(false);
        }
    }

    // =========================
    // LOGOUT
    // =========================

    function logout() {

        localStorage.removeItem('user');

        router.push('/');
    }

    // =========================
    // RETURN
    // =========================

    return (

        <div className="flex min-h-screen bg-black text-white">

            {/* SIDEBAR */}

            <div className="flex w-72 flex-col border-r border-zinc-800 bg-zinc-950">

                <div className="border-b border-zinc-800 p-8">

                    <h1 className="text-3xl font-black text-yellow-500">

                        KOMATSU

                    </h1>

                    <p className="mt-2 text-zinc-500">

                        Fleet Management System

                    </p>

                </div>

                <div className="flex flex-1 flex-col gap-3 p-5">

                    <button
                        onClick={() =>
                            setActivePage('dashboard')
                        }
                        className={`rounded-2xl px-5 py-4 text-left text-lg font-semibold transition ${
                            activePage === 'dashboard'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-zinc-900 text-white hover:bg-zinc-800'
                        }`}
                    >

                        Dashboard

                    </button>

                    <button
                        onClick={() =>
                            setActivePage('machine-history')
                        }
                        className={`rounded-2xl px-5 py-4 text-left text-lg font-semibold transition ${
                            activePage === 'machine-history'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-zinc-900 text-white hover:bg-zinc-800'
                        }`}
                    >

                        Machine History

                    </button>

                </div>

            </div>

            {/* CONTENT */}

            <div className="flex-1 overflow-auto">

{
    activePage === 'dashboard' && (

        <>

            <header className="border-b border-zinc-800 bg-zinc-950">

                <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">

                    <div>

                        <h1 className="text-4xl font-black">

                            KOMATSU FLEET SYSTEM

                        </h1>

                        <p className="mt-1 text-zinc-400">

                            Equipment Reporting Dashboard

                        </p>

                    </div>

                    <div className="flex items-center gap-4">

                        <div className="rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-3 font-mono">

                            User: {userCode}

                        </div>

                        <button
                            onClick={logout}
                            className="rounded-2xl bg-red-500 px-6 py-3 font-bold hover:bg-red-600 transition"
                        >

                            Logout

                        </button>

                    </div>

                </div>

            </header>

            <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 py-8 lg:grid-cols-3">

                {/* LEFT PANEL */}

                <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">

                    <h2 className="mb-8 text-4xl font-bold">

                        Generate Reports

                    </h2>

                    <div className="space-y-6">

                        <div>

                            <label className="mb-3 block text-lg text-zinc-400">

                                Report Type

                            </label>

                            <select
                                value={reportType}
                                onChange={(e) =>
                                    setReportType(e.target.value)
                                }
                                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-5 text-xl outline-none"
                            >

                                <option>W30</option>
                                <option>W41</option>

                            </select>

                        </div>

                        <div>

                            <label className="mb-3 block text-lg text-zinc-400">

                                Service Type

                            </label>

                            <select
                                value={serviceType}
                                onChange={(e) =>
                                    setServiceType(e.target.value)
                                }
                                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-5 text-xl outline-none"
                            >

                                <option>Pre Delivery</option>
                                <option>Delivery New</option>
                                <option>1st Service</option>
                                <option>2nd Service</option>
                                <option>3rd Service</option>
                                <option>Add. Service</option>

                            </select>

                        </div>

                        <div>

                            <label className="mb-3 block text-lg text-zinc-400">

                                Reports Count

                            </label>

                            <input
                                type="text"
                                placeholder="1"
                                value={reportCount}
                                onChange={(e) => {

                                    const value =
                                        e.target.value;

                                    if (
                                        value === ''
                                        ||
                                        (
                                            /^[0-9]+$/.test(value)
                                            &&
                                            Number(value) <= 12
                                        )
                                    ) {

                                        setReportCount(value);

                                    } else if (Number(value) > 12) {

                                        alert(
                                            'Maximum is 12 reports'
                                        );
                                    }
                                }}
                                className="w-full rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-5 text-xl outline-none"
                            />

                        </div>

                        <button
                            onClick={generateReports}
                            className="w-full rounded-2xl bg-yellow-500 px-6 py-5 text-xl font-bold text-black transition hover:bg-yellow-400"
                        >

                            Generate Reports

                        </button>

                    </div>

                </div>

                {/* RIGHT PANEL */}

                <div className="lg:col-span-2">

                    <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">

                        <h2 className="mb-2 text-4xl font-bold">

                            Fleet Machines

                        </h2>

                        <p className="mb-8 text-zinc-400">

                            Live machines loaded from database

                        </p>

                        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">

                            <input
                                type="text"
                                placeholder="Search machine"
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(e.target.value)
                                }
                                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 outline-none"
                            />

                            <select
                                value={filterType}
                                onChange={(e) =>
                                    setFilterType(e.target.value)
                                }
                                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 outline-none"
                            >

                                <option value="ALL">

                                    All Types

                                </option>

                                {[...new Set(
                                    machines.map(
                                        m => m.machine_type
                                    )
                                )].map(type => (

                                    <option
                                        key={type}
                                    >

                                        {type}

                                    </option>

                                ))}

                            </select>

                            <select
                                value={filterEngineer}
                                onChange={(e) =>
                                    setFilterEngineer(e.target.value)
                                }
                                className="rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4 outline-none"
                            >

                                <option value="ALL">

                                    All Engineers

                                </option>

                            </select>

                            <label className="flex items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-5 py-4">

                                <input
                                    type="checkbox"
                                    checked={showOnlySelected}
                                    onChange={() =>
                                        setShowOnlySelected(
                                            !showOnlySelected
                                        )
                                    }
                                />

                                Show Selected Only

                            </label>

                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-zinc-800">

                            <table className="min-w-full border-collapse">

                                <thead className="bg-zinc-900">

                                    <tr>

                                        <th className="px-6 py-5 text-left">

                                            <input
                                                type="checkbox"
                                                checked={
                                                    filteredMachines.length > 0
                                                    &&
                                                    selectedMachines.length ===
                                                    filteredMachines.length
                                                }
                                                onChange={toggleSelectAll}
                                            />

                                        </th>

                                        <th className="px-6 py-5 text-left">

                                            Machine

                                        </th>

                                        <th className="px-6 py-5 text-left">

                                            Type

                                        </th>

                                        <th className="px-6 py-5 text-left">

                                            Engine

                                        </th>

                                        <th className="px-6 py-5 text-left">

                                            SMR

                                        </th>

                                        <th className="px-6 py-5 text-left">

                                            Step

                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {filteredMachines.map(machine => (

                                        <tr
                                            key={machine.id}
                                            className="border-t border-zinc-800"
                                        >

                                            <td className="px-6 py-5">

                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        selectedMachines.includes(
                                                            machine.id
                                                        )
                                                    }
                                                    onChange={() =>
                                                        toggleMachine(
                                                            machine.id
                                                        )
                                                    }
                                                />

                                            </td>

                                            <td className="px-6 py-5">

                                                {machine.machine_number}

                                            </td>

                                            <td className="px-6 py-5">

                                                {machine.machine_type}

                                            </td>

                                            <td className="px-6 py-5">

                                                {machine.engine_number}

                                            </td>

                                            <td className="px-6 py-5">

                                                {machine.last_smr}

                                            </td>

                                            <td className="px-6 py-5">

                                                {machine.smr_step}

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </main>

        </>

    )
}


                {
                    activePage === 'machine-history' && (

                        <div className="p-10">

                            <h1 className="text-5xl font-black">

                                Machine History

                            </h1>

                            <p className="mt-3 text-xl text-zinc-500">

                                Fleet operations and service timeline

                            </p>

                            <div className="mt-10 overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">

                                <table className="min-w-full border-collapse">

                                    <thead className="bg-zinc-900">

                                        <tr>

                                            <th className="px-6 py-5 text-left">

                                                Machine

                                            </th>

                                            <th className="px-6 py-5 text-left">

                                                Operation

                                            </th>

                                            <th className="px-6 py-5 text-left">

                                                Report

                                            </th>

                                            <th className="px-6 py-5 text-left">

                                                Service

                                            </th>

                                            <th className="px-6 py-5 text-left">

                                                SMR

                                            </th>

                                            <th className="px-6 py-5 text-left">

                                                Engineer

                                            </th>

                                            <th className="px-6 py-5 text-left">

                                                Date

                                            </th>

                                        </tr>

                                    </thead>

                                    <tbody>

                                        {machineHistory.map((item, index) => (

                                            <tr
                                                key={index}
                                                className="border-t border-zinc-800"
                                            >

                                                <td className="px-6 py-5">

                                                    {item.machine_type} {item.machine_number}

                                                </td>

                                                <td className="px-6 py-5">

                                                    {item.operation_type}

                                                </td>

                                                <td className="px-6 py-5">

                                                    {item.report_type}

                                                </td>

                                                <td className="px-6 py-5">

                                                    {item.service_type}

                                                </td>

                                                <td className="px-6 py-5">

                                                    {item.smr}

                                                </td>

                                                <td className="px-6 py-5">

                                                    {item.performed_by}

                                                </td>

                                                <td className="px-6 py-5">

                                                    {
                                                        new Date(
                                                            item.operation_date
                                                        ).toLocaleDateString()
                                                    }

                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            </div>

                        </div>
                    )
                }

                {/* MODAL */}

                {
                    showDatesModal && (

                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">

                            <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 p-8">

                                <h2 className="mb-6 text-3xl font-bold">

                                    Select Report Dates

                                </h2>

                                <div className="grid gap-4">

                                    {reportDates.map((date, index) => (

                                        <div
                                            key={index}
                                            className="flex items-center gap-4"
                                        >

                                            <div className="w-32">

                                                Report {index + 1}

                                            </div>

                                            <input
                                                type="date"
                                                value={date}

                                                onChange={(e) => {

                                                    const updated =
                                                        [...reportDates];

                                                    updated[index] =
                                                        e.target.value;

                                                    setReportDates(updated);
                                                }}

                                                className="flex-1 rounded-2xl border border-zinc-700 bg-black px-5 py-4"
                                            />

                                        </div>

                                    ))}

                                </div>

                                <div className="mt-8 flex justify-end gap-4">

                                    <button
                                        onClick={() =>
                                            setShowDatesModal(false)
                                        }
                                        className="rounded-2xl bg-zinc-700 px-6 py-4"
                                    >

                                        Cancel

                                    </button>

                                    <button
                                        onClick={submitMultipleReports}
                                        className="rounded-2xl bg-yellow-500 px-6 py-4 font-bold text-black"
                                    >

                                        Generate

                                    </button>

                                </div>

                            </div>

                        </div>
                    )
                }

                {/* LOADING */}

                {
                    isGenerating && (

                        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90">

                            <div className="h-24 w-24 animate-spin rounded-full border-4 border-yellow-500 border-t-transparent"></div>

                            <h2 className="mt-8 text-3xl font-bold">

                                Generating Reports...

                            </h2>

                            <p className="mt-3 text-zinc-400">

                                Please wait

                            </p>

                        </div>
                    )
                }

            </div>

        </div>
    );
}
