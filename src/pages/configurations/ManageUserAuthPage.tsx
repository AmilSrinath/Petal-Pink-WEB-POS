import React, { useState } from 'react';
import { DataTable, Column } from '../../components/DataTable';

interface UserAuth {
  id: string;
  employeeName: string;
  userRole: string;
}

const mockUsers: UserAuth[] = [
  { id: '1', employeeName: 'Super Admin', userRole: 'Super Admin' },
  { id: '2', employeeName: 'Suweni', userRole: 'Supervisor' },
  { id: '3', employeeName: 'Nethmi', userRole: 'Supervisor' },
  { id: '4', employeeName: 'Chamodi', userRole: 'Supervisor' },
  { id: '5', employeeName: 'Naduni', userRole: 'Supervisor' },
  { id: '6', employeeName: 'Chethana', userRole: 'Supervisor' },
  { id: '7', employeeName: 'K.M Malshani Fernando', userRole: 'Supervisor' },
];

export function ManageUserAuthPage() {
  const [users] = useState(mockUsers);

  const columns: Column<UserAuth>[] = [
    { header: 'Employee Name', accessor: 'employeeName' },
    { header: 'User Role', accessor: 'userRole' },
  ];

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-6 p-6">
        <DataTable columns={columns} data={users} />
      </div>
    </div>
  );
}
