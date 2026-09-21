"use client";

import { useEffect, useState, FormEvent } from "react";
import { useAuth } from "../../auth";
import { api, PaginationEnvelope } from "@/lib/api";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { Search, X, RefreshCw, ChevronUp, ChevronDown, ArrowUpDown, Trash2 } from "lucide-react";
import { ConversationsPagination } from "@/app/dashboard/conversations/ConversationsPagination";

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

export default function UsersPage() {
  const { token, user } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Filter, search & sorting states (like Conversation History)
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<"full_name" | "email" | "role" | "status">("full_name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination states (matching Conversation History)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Form states sequence: Full Name, Email, Password, Role
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("USER");

  useEffect(() => {
    let active = true;
    async function fetchUsers() {
      if (!token) return;
      try {
        const data = await api.get<PaginationEnvelope<UserRecord>>("/api/users?limit=1000");
        if (active) setUsers(data.items || []);
      } catch (err) {
        if (active) setErrorMsg(err instanceof Error ? err.message : "Error fetching accounts");
      } finally {
        if (active) setRefreshing(false);
      }
    }
    fetchUsers();
    return () => { active = false; };
  }, [token, refreshTrigger]);

  // Reset pagination to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, statusFilter, searchTerm]);

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!newUserFullName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      setErrorMsg("Please fill out all fields.");
      return;
    }
    try {
      await api.post("/api/users", {
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserFullName,
        role: newUserRole
      });
      setSuccessMsg("Account registered successfully!");
      setNewUserFullName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("USER");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create account");
    }
  };

  const toggleStatus = async (id: string, is_active: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const endpoint = `/api/users/${id}/${is_active ? "deactivate" : "activate"}`;
    try {
      await api.post(endpoint);
      setSuccessMsg(`Account status updated successfully!`);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleSort = (col: "full_name" | "email" | "role" | "status") => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const filteredUsers = users
    .filter((u: UserRecord) => {
      const matchesRole = roleFilter === "all" || u.role.toUpperCase() === roleFilter.toUpperCase();
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && u.is_active) ||
        (statusFilter === "inactive" && !u.is_active);

      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        (u.full_name && u.full_name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.role && u.role.toLowerCase().includes(term));

      return matchesRole && matchesStatus && matchesSearch;
    })
    .sort((a: UserRecord, b: UserRecord) => {
      let valA: string | number = "";
      let valB: string | number = "";
      if (sortColumn === "full_name") {
        valA = (a.full_name || "").toLowerCase();
        valB = (b.full_name || "").toLowerCase();
      } else if (sortColumn === "email") {
        valA = (a.email || "").toLowerCase();
        valB = (b.email || "").toLowerCase();
      } else if (sortColumn === "role") {
        valA = (a.role || "").toLowerCase();
        valB = (b.role || "").toLowerCase();
      } else if (sortColumn === "status") {
        valA = a.is_active ? 1 : 0;
        valB = b.is_active ? 1 : 0;
      }
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Pagination calculation
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Selection handling (admin cannot select own account)
  const selectableUsers = filteredUsers.filter((u) => u.id !== user?.id);
  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.includes(u.id));

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(selectableUsers.map((u) => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedIds((prev) => (e.target.checked ? [...prev, id] : prev.filter((item) => item !== id)));
  };

  const handleSingleDelete = (id: string) => {
    const targetUser = users.find((u) => u.id === id);
    setDeleteModal({
      show: true,
      title: "Delete Account",
      message: `Are you sure you want to delete the account for "${targetUser?.full_name || targetUser?.email || "this user"}"? This action cannot be undone.`,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, show: false }));
        try {
          await api.delete(`/api/users/${id}`);
          setSuccessMsg("Account deleted successfully!");
          setSelectedIds((prev) => prev.filter((item) => item !== id));
          setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to delete account");
        }
      }
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      show: true,
      title: "Delete Selected Accounts",
      message: `Are you sure you want to delete ${selectedIds.length} selected account(s)? This action cannot be undone.`,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, show: false }));
        try {
          await Promise.all(selectedIds.map((id) => api.delete(`/api/users/${id}`)));
          setSuccessMsg(`${selectedIds.length} account(s) deleted successfully!`);
          setSelectedIds([]);
          setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
          setErrorMsg(err instanceof Error ? err.message : "Failed to delete selected accounts");
        }
      }
    });
  };

  if (!user || user.role !== "ADMIN") {
    return (
      <div style={{ fontFamily: "var(--font-body)", color: "#e15a64", fontWeight: "bold", padding: "28px" }}>
        UNAUTHORIZED. ADMIN ACCESS REQUIRED.
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#faf9f8",
        padding: "28px 40px 60px 40px",
        boxSizing: "border-box",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#323130"
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
        <header>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#323130", marginTop: "4px", letterSpacing: "-0.01em" }}>
            Accounts Management
          </h1>
          <p style={{ fontSize: "13px", color: "#605e5c", marginTop: "4px" }}>
            Register new accounts, configure roles, and activate or deactivate account permissions.
          </p>
        </header>

        {/* Alert Notices */}
        {errorMsg && (
          <div style={{ border: "1px solid #e15a64", background: "#fef2f3", color: "#e15a64", padding: "12px", borderRadius: "4px", fontSize: "13px" }}>
            <strong>Error:</strong> {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ border: "1px solid #b33770", background: "#fdf2f7", color: "#742774", padding: "12px", borderRadius: "4px", fontSize: "13px" }}>
            {successMsg}
          </div>
        )}

        {/* Create Card */}
        <div style={{ border: "1px solid #e1dfdd", borderRadius: "8px", padding: "20px", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "700", borderBottom: "1px solid #e1dfdd", paddingBottom: "10px", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em", color: "#323130" }}>
            Register New Account
          </h2>

          {/* Form sequence: Full Name, Email, Password, Role */}
          <form onSubmit={handleCreateUser} noValidate style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
            {/* 1. Full Name */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 2, minWidth: "180px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#605e5c", textTransform: "uppercase" }}>Full Name</label>
              <Input
                required
                type="text"
                placeholder="Ash Ketchum"
                value={newUserFullName}
                onChange={(e) => setNewUserFullName(e.target.value)}
              />
            </div>

            {/* 2. Email */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1, minWidth: "160px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#605e5c", textTransform: "uppercase" }}>Email</label>
              <Input
                required
                type="email"
                placeholder="account@company.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>

            {/* 3. Password */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1, minWidth: "140px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#605e5c", textTransform: "uppercase" }}>Password</label>
              <Input
                required
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>

            {/* 4. Role (Only User and Admin) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexGrow: 1, minWidth: "130px" }}>
              <label style={{ fontSize: "11px", fontWeight: "600", color: "#605e5c", textTransform: "uppercase" }}>Role</label>
              <Select
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                style={{
                  height: "36px",
                  padding: "0 28px 0 10px",
                  border: "1px solid #e1dfdd",
                  borderRadius: "4px",
                  background: "#ffffff",
                  color: "#323130",
                  fontSize: "13px",
                  width: "100%"
                }}
              >
                <option value="USER">User (Standard)</option>
                <option value="ADMIN">Admin (Full Access)</option>
              </Select>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              style={{ height: "36px" }}
            >
              Add Account
            </Button>
          </form>
        </div>

        {/* Accounts List Table Card */}
        <div style={{ 
          border: "1px solid #e1dfdd", 
          background: "#ffffff",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
          marginTop: "16px"
        }}>
          <div style={{ 
            padding: "16px 20px", 
            borderBottom: "1px solid #e1dfdd", 
            background: "#faf9f8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "#323130" }}>
                Registered Accounts Directory
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: "120px", height: "36px", fontSize: "13px", padding: "0 28px 0 10px", flexShrink: 0 }}
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </Select>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "120px", height: "36px", fontSize: "13px", padding: "0 28px 0 10px", flexShrink: 0 }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>

              <div style={{ position: "relative", display: "flex", alignItems: "center", width: "220px", flexShrink: 0 }}>
                <Search style={{ position: "absolute", left: "10px", width: "14px", height: "14px", color: "#605e5c", pointerEvents: "none" }} />
                <Input
                  type="text"
                  placeholder="Search Keywords..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    if (!e.target.value) {
                      setSearchTerm("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      setSearchTerm(searchInput.trim());
                    }
                  }}
                  style={{
                    paddingLeft: "32px",
                    paddingRight: searchInput ? "28px" : "10px",
                    width: "100%",
                    height: "36px",
                    fontSize: "13px"
                  }}
                />
                {searchInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchInput("");
                      setSearchTerm("");
                    }}
                    style={{ position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)", padding: "2px", height: "auto", minHeight: "unset" }}
                  >
                    <X style={{ width: "13px", height: "13px" }} />
                  </Button>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRefreshing(true);
                  setRefreshTrigger((prev) => prev + 1);
                }}
                disabled={refreshing}
                style={{ height: "36px", padding: "0 12px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <RefreshCw style={{ width: "13px", height: "13px", animation: refreshing ? "spin 1s linear infinite" : "none" }} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Action Bar: Checkbox & Bulk Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 20px 8px 17px" }}>
            <Input
              type="checkbox"
              onChange={handleSelectAll}
              checked={isAllSelected}
              style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "#742774" }}
              title="Select All"
            />

            {selectedIds.length > 0 && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                style={{
                  height: "24px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  fontWeight: "700",
                  lineHeight: "1",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title={`Delete ${selectedIds.length} selected item(s)`}
              >
                <Trash2 style={{ width: "12px", height: "12px" }} />
                <span>Delete ({selectedIds.length})</span>
              </Button>
            )}
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#faf9f8", borderBottom: "1px solid #e1dfdd", textAlign: "left", color: "#605e5c", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", userSelect: "none" }}>
                  <th
                    colSpan={2}
                    onClick={() => handleSort("full_name")}
                    style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", transition: "color 0.15s ease" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span>Full Name</span>
                      {sortColumn === "full_name" ? (
                        sortDirection === "asc" ? <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} /> : <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                      ) : (
                        <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("email")}
                    style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", transition: "color 0.15s ease" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span>Email</span>
                      {sortColumn === "email" ? (
                        sortDirection === "asc" ? <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} /> : <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                      ) : (
                        <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("role")}
                    style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", transition: "color 0.15s ease" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span>Role</span>
                      {sortColumn === "role" ? (
                        sortDirection === "asc" ? <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} /> : <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                      ) : (
                        <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    style={{ padding: "12px 16px", textAlign: "left", cursor: "pointer", transition: "color 0.15s ease" }}
                  >
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span>Status</span>
                      {sortColumn === "status" ? (
                        sortDirection === "asc" ? <ChevronUp style={{ width: "14px", height: "14px", color: "#742774" }} /> : <ChevronDown style={{ width: "14px", height: "14px", color: "#742774" }} />
                      ) : (
                        <ArrowUpDown style={{ width: "12px", height: "12px", opacity: 0.4 }} />
                      )}
                    </div>
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "160px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                      {users.length === 0 ? "No accounts logged." : "No accounts found matching your criteria."}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isSelectedRow = selectedIds.includes(u.id);
                    const isSelf = user.id === u.id;
                    const displayRole = u.role === "ADMIN" ? "ADMIN" : "USER";

                    return (
                      <tr
                        key={u.id}
                        style={{
                          borderBottom: "1px solid #f3f2f1",
                          background: isSelectedRow ? "#efe5ef" : "transparent",
                          transition: "background-color 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelectedRow) e.currentTarget.style.backgroundColor = "#faf9f8";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelectedRow) e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <td style={{ padding: "12px 16px", width: "40px", verticalAlign: "middle" }}>
                          <Input
                            type="checkbox"
                            checked={isSelectedRow}
                            disabled={isSelf}
                            onChange={(e) => handleSelectOne(u.id, e)}
                            style={{
                              width: "18px",
                              height: "18px",
                              cursor: isSelf ? "not-allowed" : "pointer",
                              accentColor: "#742774"
                            }}
                            title={isSelf ? "Cannot select own account" : undefined}
                          />
                        </td>
                        <td style={{ padding: "12px 16px", fontWeight: "600", color: "#323130", textAlign: "left", verticalAlign: "middle" }}>
                          {u.full_name}
                        </td>
                        <td style={{ padding: "12px 16px", color: "#605e5c", textAlign: "left", verticalAlign: "middle" }}>
                          {u.email}
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "left", verticalAlign: "middle" }}>
                          <span style={{ 
                            padding: "3px 8px", 
                            background: displayRole === "ADMIN" ? "#efe5ef" : "#fdf2f7", 
                            color: displayRole === "ADMIN" ? "#742774" : "#b33770", 
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "600",
                            border: displayRole === "ADMIN" ? "1px solid #d8bfd8" : "1px solid #f6dbe7"
                          }}>
                            {displayRole}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "left", verticalAlign: "middle" }}>
                          <span style={{ 
                            padding: "3px 8px", 
                            background: u.is_active ? "#efe5ef" : "#fef2f3", 
                            color: u.is_active ? "#742774" : "#e15a64", 
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: "600",
                            border: u.is_active ? "1px solid #d8bfd8" : "1px solid #fad5d8"
                          }}>
                            {u.is_active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", textAlign: "left", verticalAlign: "middle", width: "160px" }}>
                          {isSelf ? (
                            <span style={{ fontSize: "11px", color: "#605e5c", fontStyle: "italic" }}>
                              Current user
                            </span>
                          ) : (
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <Button 
                                onClick={() => toggleStatus(u.id, u.is_active)}
                                variant={u.is_active ? "ghost" : "primary"}
                                size="sm"
                              >
                                {u.is_active ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSingleDelete(u.id)}
                                style={{ color: "#e15a64", padding: "4px" }}
                                title="Delete Account"
                              >
                                <Trash2 style={{ width: "14px", height: "14px" }} />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <ConversationsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            startIndex={startIndex}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(size) => {
              setItemsPerPage(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <Modal
          isOpen={deleteModal.show}
          onClose={() => setDeleteModal((prev) => ({ ...prev, show: false }))}
          title={deleteModal.title}
          icon={<Trash2 style={{ width: "20px", height: "20px", color: "#e15a64" }} />}
          maxWidth="sm"
          footer={
            <>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setDeleteModal((prev) => ({ ...prev, show: false }))}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={deleteModal.onConfirm}
              >
                Delete
              </Button>
            </>
          }
        >
          <p style={{ fontSize: "13.5px", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>
            {deleteModal.message}
          </p>
        </Modal>
      )}
    </div>
  );
}
