import React from 'react';

const AdminUsers: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="mt-2 text-gray-600">مراجعة وإدارة جميع مستخدمي المنصة</p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">قائمة المستخدمين</h2>
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">قريباً</h3>
              <p className="mt-1 text-sm text-gray-500">
                ستكون متاحة قائمة المستخدمين قريباً
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
