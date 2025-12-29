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
      <div className="rounded-lg mt-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="max-w-7xl mx-auto space-y-4">
            {adminUploaded ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-gray-900">Product Data Available</h2>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Convex
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 text-left">Admin has uploaded the latest product file for processing</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">File Name:</span>
                        <span className="text-gray-900 truncate ml-2">{adminFileName}</span>
                      </div>
                      {adminConvexDate && (
                        <div className="flex items-center py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">Uploaded:</span>
                          <span className="text-gray-900 ml-2">{adminConvexDate}</span>
                        </div>
                      )}
                      {adminConvexUploader && (
                        <div className="flex items-center py-2 border-b border-gray-100">
                          <span className="font-medium text-gray-700">By:</span>
                          <span className="text-gray-900 ml-2">{adminConvexUploader}</span>
                        </div>
                      )}
                    </div>

                    {adminLoadingText && (
                      <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-medium text-blue-700">{adminLoadingText}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-1 text-left">No Product Data Available</h3>
                    <p className="text-sm text-yellow-700 text-left">Please wait for an administrator to upload the product file before proceeding with your sales summary.</p>
                  </div>
                </div>
              </div>
            )}

            {localAdminUploaded && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-amber-800">Local Product Data</h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        LocalStorage
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 mb-4">Using locally stored product data (fallback)</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between items-center py-2 border-b border-amber-200">
                        <span className="font-medium text-amber-800">File Name:</span>
                        <span className="text-amber-900 truncate ml-2">{localAdminFileName}</span>
                      </div>
                      {localAdminDate && (
                        <div className="flex justify-between items-center py-2 border-b border-amber-200">
                          <span className="font-medium text-amber-800">Uploaded:</span>
                          <span className="text-amber-900 ml-2">{localAdminDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
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
            <div className="text-left mb-10">
              <div className="flex items-center gap-4 mb-4">
                <h3 className="text-2xl font-bold text-gray-800 mb-0">Complete Your Sales Summary</h3>
              </div>
              <p className="text-gray-600">Add transaction details to finalize your sales data submission</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="group">
                <label htmlFor="transactionCount" className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-4 group-focus-within:text-blue-600 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Transaction Count <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="transactionCount"
                    type="number"
                    required
                    value={transactionCount ?? ''}
                    onChange={(e) => setTransactionCount(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white shadow-sm text-lg"
                    placeholder="Enter transaction count"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group">
                <label htmlFor="headCount" className="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-4 group-focus-within:text-blue-600 transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  Head Count <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="headCount"
                    type="number"
                    required
                    value={headCount ?? ''}
                    onChange={(e) => setHeadCount(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-4 pl-12 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-200 bg-white shadow-sm text-lg"
                    placeholder="Enter head count"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-amber-800 font-medium">Important Note</p>
                  <p className="text-sm text-amber-700 mt-1">If you re-upload your Excel files, please re-enter the total transaction count and head count for that day. These values are not automatically preserved during re-uploads.</p>
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
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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