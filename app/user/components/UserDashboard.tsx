'use client';

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ExcelBranchCompare } from "../../../components/ExcelBranchCompare";


export function UserDashboard({ currentUser }: { currentUser: any }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const userCount = useQuery(api.users.getUserCount);
  const uploadedData = useQuery(api.uploadedData.getUploadedData);
  const latestAdminProductFile = useQuery(api.uploadedData.getLatestAdminProductFile);
  const saveSalesSummary = useMutation(api.userSalesSummaries.saveUserSalesSummary);

  // Test JWT token
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [excelBData, setExcelBData] = useState<{ headers: string[], rows: any[][] } | null>(null);
  const [excelCData, setExcelCData] = useState<{ headers: string[], rows: any[][] } | null>(null);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [transactionCount, setTransactionCount] = useState<number | undefined>(undefined);
  const [headCount, setHeadCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    const testToken = async () => {
      if (clerkLoaded && clerkUser) {
        try {
          const token = await getToken({ template: "convex" });
          console.log('JWT raw token:', token);
          setJwtToken(token ? "Token received" : "No token");
          console.log('JWT Token available:', !!token);
        } catch (error) {
          console.error('JWT Token error:', error);
          setJwtToken("Token error");
        }
      }
    };
    testToken();
  }, [clerkLoaded, clerkUser, getToken]);

  // Only show ExcelB upload for user role, otherwise nothing
  if (currentUser?.role === 'user') {
    // Use the new query for admin product file
    let adminUploaded = false;
    let adminFileName = '';
    let adminConvexDate = '';
    let adminConvexDateObj = null;
    let adminConvexUploader = '';
    let adminConvexDataPreview = null;
    if (latestAdminProductFile) {
      adminUploaded = true;
      adminFileName = latestAdminProductFile.fileName || 'Admin Product File';
      if (latestAdminProductFile.createdAt) {
        adminConvexDateObj = new Date(latestAdminProductFile.createdAt);
        adminConvexDate = adminConvexDateObj.toLocaleString();
      }
      adminConvexUploader = latestAdminProductFile.uploaderName || '';
      if (latestAdminProductFile.data && Array.isArray(latestAdminProductFile.data) && Array.isArray(latestAdminProductFile.data[0])) {
        const [header, ...rows] = latestAdminProductFile.data;
        adminConvexDataPreview = rows.map((row: any[]) => {
          const obj: any = {};
          header.forEach((key: string, idx: number) => {
            obj[key] = row[idx];
          });
          return obj;
        });
      } else if (latestAdminProductFile.data && Array.isArray(latestAdminProductFile.data)) {
        adminConvexDataPreview = latestAdminProductFile.data;
      } else if (!latestAdminProductFile.data || latestAdminProductFile.data.length === 0) {
        adminConvexDataPreview = 'No data in this file.';
      }
    }

    // Check for admin-uploaded file in localStorage
    let localAdminUploaded = false;
    let localAdminFileName = '';
    let localAdminDate = '';
    let localAdminDateObj = null;
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('uploadedData');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (parsed && parsed.data && parsed.data.length > 0) {
            localAdminUploaded = true;
            localAdminFileName = parsed.fileName || 'Admin Product File (Local)';
            if (parsed.date) {
              localAdminDateObj = new Date(parsed.date);
              localAdminDate = localAdminDateObj.toLocaleString();
            }
          }
        } catch {}
      }
    }

    return (
      <div className="bg-white rounded-lg p-8 mt-12 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Upload Your Item Sales Report</h2>
        <div className="mb-6">
          <div className="flex flex-col gap-2 items-center">
            {adminUploaded ? (
              <div className="flex flex-col items-center">
                <span className="text-green-700 font-medium">
                  Admin uploaded: <span className="font-semibold">{adminFileName}</span> (Convex)
                  {adminConvexDate && (
                    <span className="text-xs text-gray-600 ml-2">on {adminConvexDate}</span>
                  )}
                </span>
                {adminConvexUploader && (
                  <span className="text-xs text-gray-500">Uploader: {adminConvexUploader}</span>
                )}
                {adminConvexDataPreview && typeof adminConvexDataPreview === 'string' ? (
                  <div className="mt-2 w-full text-xs text-red-500">{adminConvexDataPreview}</div>
                ) : adminConvexDataPreview && Array.isArray(adminConvexDataPreview) && adminConvexDataPreview.length > 0 ? (
                  <div className="mt-2 w-full">
                    <span className="text-xs text-gray-700 font-semibold">Preview of uploaded file:</span>
                    <div className="overflow-x-auto mt-1 border rounded bg-gray-50 max-h-[32rem]" style={{maxHeight:'32rem', minWidth:'100%'}}>
                      <table className="min-w-[56rem] w-full text-sm text-left">
                        <thead>
                          <tr>
                            {Object.keys(adminConvexDataPreview[0]).map((key) => (
                              <th key={key} className="px-4 py-2 border-b font-bold bg-gray-100 text-base">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {adminConvexDataPreview.map((row, idx) => (
                            <tr key={idx}>
                              {Object.values(row).map((val, i) => (
                                <td key={i} className="px-4 py-2 border-b text-base">{String(val)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : adminConvexDataPreview ? (
                  <div className="mt-2 w-full">
                    <span className="text-xs text-gray-700">Preview:</span>
                    <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto max-w-xs">
                      {JSON.stringify(adminConvexDataPreview, null, 2)}
                    </pre>
                  </div>
                ) : null}
              </div>
            ) : (
              <span className="text-red-600">No admin product file found in Convex</span>
            )}
            {localAdminUploaded && (
              <div className="flex flex-col items-center w-full">
                <span className="text-green-700 font-medium">
                  Admin uploaded: <span className="font-semibold">{localAdminFileName}</span> (LocalStorage)
                  {localAdminDate && (
                    <span className="text-xs text-gray-600 ml-2">on {localAdminDate}</span>
                  )}
                </span>
                {/* LocalStorage preview table */}
                {(() => {
                  if (typeof window !== 'undefined') {
                    const local = localStorage.getItem('uploadedData');
                    if (local) {
                      try {
                        const parsed = JSON.parse(local);
                        if (parsed && parsed.data && Array.isArray(parsed.data) && Array.isArray(parsed.data[0])) {
                          const [header, ...rows]: [string[], ...any[][]] = parsed.data;
                          const previewRows = rows.map((row: any[]) => {
                            const obj: { [key: string]: any } = {};
                            (header as string[]).forEach((key: string, idx: number) => {
                              obj[key] = row[idx];
                            });
                            return obj;
                          });

                        }
                      } catch {}
                    }
                  }
                  return null;
                })()}
              </div>
            )}
            {!(adminUploaded || localAdminUploaded) && (
              <span className="text-gray-500">No admin product file found</span>
            )}
          </div>
        </div>
        <ExcelBranchCompare
          excelAProducts={(() => {
            if (adminUploaded && latestAdminProductFile && latestAdminProductFile.data) {
              if (Array.isArray(latestAdminProductFile.data) && Array.isArray(latestAdminProductFile.data[0])) {
                const [header, ...rows] = latestAdminProductFile.data;
                return rows.map((row: any[]) => {
                  const obj: any = {};
                  header.forEach((key: string, idx: number) => {
                    obj[key] = row[idx];
                  });
                  return obj;
                });
              }
              return latestAdminProductFile.data;
            }
            // fallback: try localStorage
            if (localAdminUploaded && typeof window !== 'undefined') {
              const local = localStorage.getItem('uploadedData');
              if (local) {
                try {
                  const parsed = JSON.parse(local);
                  if (parsed && parsed.data && Array.isArray(parsed.data) && Array.isArray(parsed.data[0])) {
                    const [header, ...rows] = parsed.data;
                    return rows.map((row: any[]) => {
                      const obj: any = {};
                      header.forEach((key: string, idx: number) => {
                        obj[key] = row[idx];
                      });
                      return obj;
                    });
                  }
                } catch {}
              }
            }
            return [];
          })()}
          onExcelBData={setExcelBData}
          onExcelCData={setExcelCData}
          onBranchCode={setBranchCode}
          currentUser={currentUser}
        />

        <div className="mt-8 text-center">
          <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-center">
            <div className="flex flex-col">
              <label htmlFor="transactionCount" className="text-sm font-medium text-gray-700 mb-1">Transaction Count</label>
              <input
                id="transactionCount"
                type="number"
                value={transactionCount ?? ''}
                onChange={(e) => setTransactionCount(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter transaction count"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="headCount" className="text-sm font-medium text-gray-700 mb-1">Head Count</label>
              <input
                id="headCount"
                type="number"
                value={headCount ?? ''}
                onChange={(e) => setHeadCount(e.target.value ? parseInt(e.target.value) : undefined)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter head count"
              />
            </div>
          </div>
          {excelBData && excelCData && branchCode && transactionCount !== undefined && headCount !== undefined && (
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded shadow"
              onClick={async () => {
                if (!excelBData) return;
                // Aggregate data from excelBData
                const { headers: bHeaders, rows: bRows } = excelBData;
                const saleStatusIdx = bHeaders.findIndex(h => h.toLowerCase() === 'sale_status');
                const qtyIdx = bHeaders.findIndex(h => h.toLowerCase() === 'qty');
                const amountIdx = bHeaders.findIndex(h => h.toLowerCase() === 'total amount');
                let regularQty = 0;
                let regularAmt = 0;
                let nonRegularQty = 0;
                let nonRegularAmt = 0;
                for (const row of bRows) {
                  const saleStatus = row[saleStatusIdx];
                  const qty = qtyIdx !== -1 ? parseFloat(row[qtyIdx]?.toString().replace(/,/g, '') || '0') : 1;
                  const amt = amountIdx !== -1 ? parseFloat(row[amountIdx]?.toString().replace(/,/g, '') || '0') : 0;
                  if (saleStatus === 'R') {
                    regularQty += qty;
                    regularAmt += amt;
                  } else if (saleStatus === 'NR') {
                    nonRegularQty += qty;
                    nonRegularAmt += amt;
                  }
                }
                const totalQtySold = regularQty + nonRegularQty;
                let totalAmt = regularAmt + nonRegularAmt;
                // Round to 2 decimal places
                regularAmt = Math.round(regularAmt * 100) / 100;
                nonRegularAmt = Math.round(nonRegularAmt * 100) / 100;
                totalAmt = Math.round(totalAmt * 100) / 100;

                // Aggregate payments from excelCData
                let cashCheck = 0;
                let charge = 0;
                let gc = 0;
                const creditNote = 0;
                if (excelCData) {
                  const { headers: cHeaders, rows: cRows } = excelCData;
                  const cashIdx = cHeaders.findIndex(h => h.toLowerCase() === 'cash');
                  const creditCardIdx = cHeaders.findIndex(h => h.toLowerCase() === 'credit card');
                  const debitCardIdx = cHeaders.findIndex(h => h.toLowerCase() === 'debit card');
                  const gcashIdx = cHeaders.findIndex(h => h.toLowerCase() === 'gcash');
                  const salmonCreditIdx = cHeaders.findIndex(h => h.toLowerCase() === 'salmon credit');
                  const gcIdx = cHeaders.findIndex(h => h.toLowerCase() === 'gc');
                  for (const row of cRows) {
                    cashCheck += cashIdx !== -1 ? parseFloat(row[cashIdx]?.toString().replace(/,/g, '') || '0') : 0;
                    const cc = creditCardIdx !== -1 ? parseFloat(row[creditCardIdx]?.toString().replace(/,/g, '') || '0') : 0;
                    const dc = debitCardIdx !== -1 ? parseFloat(row[debitCardIdx]?.toString().replace(/,/g, '') || '0') : 0;
                    const gcash = gcashIdx !== -1 ? parseFloat(row[gcashIdx]?.toString().replace(/,/g, '') || '0') : 0;
                    const salmon = salmonCreditIdx !== -1 ? parseFloat(row[salmonCreditIdx]?.toString().replace(/,/g, '') || '0') : 0;
                    charge += cc + dc + gcash + salmon;
                    gc += gcIdx !== -1 ? parseFloat(row[gcIdx]?.toString().replace(/,/g, '') || '0') : 0;
                  }
                }
                // Round payments
                cashCheck = Math.round(cashCheck * 100) / 100;
                charge = Math.round(charge * 100) / 100;
                gc = Math.round(gc * 100) / 100;
                const totalPayments = cashCheck + charge + gc + creditNote;
                const amountsMatch = Math.abs(totalAmt - totalPayments) < 0.01; // floating point comparison

                try {
                  await saveSalesSummary({
                    branchCode,
                    regularQty,
                    regularAmt,
                    nonRegularQty,
                    nonRegularAmt,
                    totalQtySold,
                    totalAmt,
                    cashCheck,
                    charge,
                    gc,
                    creditNote,
                    totalPayments,
                    amountsMatch,
                    storeId: currentUser?.storeId,
                    branch: currentUser?.branch,
                    region: currentUser?.region,
                    province: currentUser?.province,
                    city: currentUser?.city,
                    lessor: currentUser?.lessor,
                    mallName: currentUser?.mallName,
                    transactionCount,
                    headCount,
                  });
                  alert('Sales summary saved successfully!');
                  // Reset data
                  setExcelBData(null);
                  setExcelCData(null);
                  setBranchCode(null);
                  setTransactionCount(undefined);
                  setHeadCount(undefined);
                } catch (error) {
                  console.error('Error saving sales summary:', error);
                  alert('Failed to save sales summary.');
                }
              }}
            >
              Save Sales Summary
            </button>
          )}
        </div>
      </div>
    );
  }
  return null;
}