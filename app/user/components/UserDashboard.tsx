'use client';

import { useUser, useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ExcelBranchCompare } from "../../../components/ExcelBranchCompare";
import { ValidationErrorModal } from "../../../components/ValidationErrorModal";
import { SuccessErrorModal } from "../../../components/SuccessErrorModal";


export function UserDashboard({ currentUser }: { currentUser: any }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const userCount = useQuery(api.users.getUserCount);
  const uploadedData = useQuery(api.uploadedData.getUploadedData);
  const latestAdminProductFile = useQuery(api.uploadedData.getLatestAdminProductFile);
  const saveSalesSummary = useMutation(api.userSalesSummaries.saveUserSalesSummary);

  // Load admin data in chunks
  const [adminDataChunks, setAdminDataChunks] = useState<any[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadedRows, setLoadedRows] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [loadedOffsets, setLoadedOffsets] = useState<Set<number>>(new Set());
  const chunkQuery = useQuery(api.uploadedData.getUploadedDataContent, {
    fileId: latestAdminProductFile?.fileId || "",
    offset: currentOffset,
    limit: 8000
  });

  useEffect(() => {
    if (chunkQuery && chunkQuery.data && chunkQuery.data.length > 0) {
      setAdminDataChunks(prev => {
        if (!loadedOffsets.has(currentOffset)) {
          setLoadedOffsets(prevOffsets => new Set([...prevOffsets, currentOffset]));
          return [...prev, ...chunkQuery.data];
        }
        return prev;
      });
      setTotalRows(chunkQuery.totalRows);
      setLoadedRows(prev => prev + chunkQuery.data.length);
      if (chunkQuery.hasMore) {
        setCurrentOffset(chunkQuery.nextOffset);
        setLoadingMore(true);
      } else {
        setLoadingMore(false);
      }
    }
  }, [chunkQuery, currentOffset, loadedOffsets]);

  const adminData = adminDataChunks.length > 0 ? adminDataChunks : null;

  // Test JWT token
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [excelBData, setExcelBData] = useState<{ headers: string[], rows: any[][] } | null>(null);
  const [excelCData, setExcelCData] = useState<{ headers: string[], rows: any[][] } | null>(null);
  const [branchCode, setBranchCode] = useState<string | null>(null);
  const [transactionCount, setTransactionCount] = useState<number | undefined>(undefined);
  const [headCount, setHeadCount] = useState<number | undefined>(undefined);
  const [hasValidationErrors, setHasValidationErrors] = useState<boolean>(false);
  const [validationModalOpen, setValidationModalOpen] = useState<boolean>(false);
  const [unmatchedItems, setUnmatchedItems] = useState<Array<{
    barcode?: string;
    itemName?: string;
    stockNo?: string;
    rowIndex: number;
  }>>([]);
  const [notificationModalOpen, setNotificationModalOpen] = useState<boolean>(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [notificationTitle, setNotificationTitle] = useState<string>('');
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [clearTrigger, setClearTrigger] = useState<number>(0);

  // Validate ExcelB data for "Not Found" entries
  useEffect(() => {
    if (excelBData && excelBData.rows.length > 0) {
      const saleStatusIdx = excelBData.headers.findIndex(h => h.toLowerCase() === 'sale_status');
      const barcodeIdx = excelBData.headers.findIndex(h => h.toLowerCase() === 'barcode');
      const itemNameIdx = excelBData.headers.findIndex(h => h.toLowerCase().includes('item') || h.toLowerCase().includes('name'));
      const stockNoIdx = excelBData.headers.findIndex(h => h.toLowerCase().includes('stock') && h.toLowerCase().includes('no'));

      if (saleStatusIdx !== -1) {
        const unmatched: Array<{
          barcode?: string;
          itemName?: string;
          stockNo?: string;
          rowIndex: number;
        }> = [];

        excelBData.rows.forEach((row, index) => {
          const saleStatus = String(row[saleStatusIdx] ?? '').trim().toLowerCase();
          if (saleStatus === 'not found') {
            unmatched.push({
              barcode: barcodeIdx !== -1 ? String(row[barcodeIdx] ?? '') : undefined,
              itemName: itemNameIdx !== -1 ? String(row[itemNameIdx] ?? '') : undefined,
              stockNo: stockNoIdx !== -1 ? String(row[stockNoIdx] ?? '') : undefined,
              rowIndex: index
            });
          }
        });

        if (unmatched.length > 0) {
          setHasValidationErrors(true);
          setUnmatchedItems(unmatched);
          setValidationModalOpen(true);
        } else if (unmatched.length === 0 && hasValidationErrors) {
          setHasValidationErrors(false);
          setUnmatchedItems([]);
          setValidationModalOpen(false);
        }
      }
    } else {
      setHasValidationErrors(false);
      setUnmatchedItems([]);
      setValidationModalOpen(false);
    }
  }, [excelBData]);

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
    let adminLoadingText = '';
    let adminConvexDataPreview = null;
    if (latestAdminProductFile) {
      adminUploaded = true;
      adminFileName = latestAdminProductFile.fileName || 'Admin Product File';
      if (latestAdminProductFile.createdAt) {
        adminConvexDateObj = new Date(latestAdminProductFile.createdAt);
        adminConvexDate = adminConvexDateObj.toLocaleString();
      }
      adminConvexUploader = latestAdminProductFile.uploaderName || '';
      if (loadingMore) {
        adminLoadingText = `Loading data: ${loadedRows} / ${totalRows} rows`;
      }
      if (adminData && Array.isArray(adminData) && adminData.length > 0) {
        const header = ["name", "stock_no", "barcode", "status", "retail_price", "landed_cost", "sale_status"];
        const rows = adminData;
        adminConvexDataPreview = rows.map((row: any[]) => {
          const obj: any = {};
          header.forEach((key: string, idx: number) => {
            obj[key] = row[idx];
          });
          return obj;
        });
      } else if (adminData && Array.isArray(adminData)) {
        adminConvexDataPreview = adminData;
      } else if (!adminData || (adminData as any[]).length === 0) {
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
        } catch { }
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
                {adminLoadingText && (
                  <span className="text-xs text-blue-500 ml-2">{adminLoadingText}</span>
                )}
                {/* Convex preview table */}
                {/* {adminConvexDataPreview && typeof adminConvexDataPreview === 'string' ? (
                  <div className="mt-2 w-full text-xs text-red-500">{adminConvexDataPreview}</div>
                ) : adminConvexDataPreview && Array.isArray(adminConvexDataPreview) && adminConvexDataPreview.length > 0 ? (
                  <div className="mt-2 w-full">
                    <span className="text-xs text-gray-700 font-semibold">Preview of uploaded file:</span>
                    <div className="overflow-x-auto mt-1 border rounded bg-gray-50 max-h-[32rem]" style={{ maxHeight: '32rem', minWidth: '100%' }}>
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
                ) : null} */}
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
                {/* {(() => {
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
                          if (previewRows.length > 0) {
                            return (
                              <div className="mt-2 w-full">
                                <span className="text-xs text-gray-700 font-semibold">Preview of uploaded file (LocalStorage):</span>
                                <div className="overflow-x-auto mt-1 border rounded bg-gray-50 max-h-[32rem]" style={{ maxHeight: '32rem', minWidth: '100%' }}>
                                  <table className="min-w-[80rem] max-w-[180rem] w-full text-sm text-left">
                                    <thead>
                                      <tr>
                                        {Object.keys(previewRows[0]).map((key: string) => (
                                          <th key={key} className="px-4 py-2 border-b font-bold bg-gray-100 text-base">{key}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {previewRows.map((row: { [key: string]: any }, idx: number) => (
                                        <tr key={idx}>
                                          {Object.values(row).map((val: any, i: number) => (
                                            <td key={i} className="px-4 py-2 border-b text-base">{String(val)}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          }
                        }
                      } catch { }
                    }
                  }
                  return null;
                })()} */}
              </div>
            )}
            {!(adminUploaded || localAdminUploaded) && (
              <span className="text-gray-500">No admin product file found</span>
            )}
          </div>
        </div>
        <ExcelBranchCompare
          excelAProducts={(() => {
            if (adminUploaded && latestAdminProductFile && adminData) {
              const header = ["name", "stock_no", "barcode", "status", "retail_price", "landed_cost", "sale_status"];
              const rows = adminData;
              return rows.map((row: any[]) => {
                const obj: any = {};
                header.forEach((key: string, idx: number) => {
                  obj[key] = row[idx];
                });
                return obj;
              });
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
                } catch { }
              }
            }
            return [];
          })()}
          onExcelBData={setExcelBData}
          onExcelCData={setExcelCData}
          onBranchCode={setBranchCode}
          clearTrigger={clearTrigger}
          currentUser={currentUser}
        />

        <div className="mt-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100 shadow-sm">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-800 mb-2">Additional Information</h3>
              <p className="text-sm text-gray-600">Complete your sales summary with transaction details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="group">
                <label htmlFor="transactionCount" className="block text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                  Transaction Count
                </label>
                <div className="relative">
                  <input
                    id="transactionCount"
                    type="number"
                    value={transactionCount ?? ''}
                    onChange={(e) => setTransactionCount(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm"
                    placeholder="Enter transaction count"
                  />
                </div>
              </div>

              <div className="group">
                <label htmlFor="headCount" className="block text-base font-semibold text-gray-700 mb-3 group-focus-within:text-blue-600 transition-colors">
                  Head Count
                </label>
                <div className="relative">
                  <input
                    id="headCount"
                    type="number"
                    value={headCount ?? ''}
                    onChange={(e) => setHeadCount(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm"
                    placeholder="Enter head count"
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                className={`inline-flex items-center px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform ${excelBData && excelCData && branchCode && transactionCount !== undefined && headCount !== undefined && !hasValidationErrors
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-sm'
                  }`}
                disabled={!(excelBData && excelCData && branchCode && transactionCount !== undefined && headCount !== undefined && !hasValidationErrors)}
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
                      branchCode: branchCode!,
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
                    // Reset data
                    setExcelBData(null);
                    setExcelCData(null);
                    setBranchCode(null);
                    setTransactionCount(undefined);
                    setHeadCount(undefined);
                    setHasValidationErrors(false);
                    setClearTrigger(prev => prev + 1);

                    // Show success modal
                    setNotificationType('success');
                    setNotificationTitle('Success!');
                    setNotificationMessage('Sales summary saved successfully!');
                    setNotificationModalOpen(true);
                  } catch (error) {
                    console.error('Error saving sales summary:', error);
                    // Show error modal
                    setNotificationType('error');
                    setNotificationTitle('Error');
                    setNotificationMessage('Failed to save sales summary. Please try again.');
                    setNotificationModalOpen(true);
                  }
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Sales Summary
              </button>
            </div>
          </div>
        </div>

        <ValidationErrorModal
          open={validationModalOpen}
          onOpenChange={setValidationModalOpen}
          unmatchedItems={unmatchedItems}
        />

        <SuccessErrorModal
          open={notificationModalOpen}
          onOpenChange={setNotificationModalOpen}
          type={notificationType}
          title={notificationTitle}
          message={notificationMessage}
        />
      </div>
    );
  }
  return null;
}