

import type { User, Equipment, Assignment, Category, Model, AuditLogEntry, Country, Site, Department } from './types';
import { UserRole, EquipmentStatus, FormAction, AssignmentStatus } from './types';

export const ALL_USERS: User[] = [
  // Existing users from Login/Dashboard
  { id: 'user-1', name: 'Alice Admin', role: UserRole.ADMIN, department: 'IT', avatarUrl: 'https://i.pravatar.cc/150?u=user-1', employeeId: '10001', email: 'alice.admin@example.com', password: 'Admin2022', pin: '111111' },
  { id: 'user-2', name: 'Robert Brown', role: UserRole.MANAGER, department: 'Management', avatarUrl: 'https://i.pravatar.cc/150?u=user-2', employeeId: '10002', email: 'robert.brown@example.com', managerId: 'user-1', password: '22222', pin: '222222' },
  { id: 'user-3', name: 'Jane Smith', role: UserRole.EMPLOYEE, department: 'Engineering', avatarUrl: 'https://i.pravatar.cc/150?u=user-3', employeeId: '10003', email: 'jane.smith@example.com', managerId: 'user-2', password: '33333', pin: '333333' },
  { id: 'user-4', name: 'Ethan Harper', role: UserRole.EMPLOYEE, department: 'Engineering', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmWVYY7jD-zGHMzq1Lzg6BgvHf3MWGcsvW1pXKV3aoCLgnOxO6cX3qS-3owD9gSMolAN9ewLJWoxNgtPlj4GyMsL0dN0QzHL77Idz7lOJYmddCQlKD0zADsCYaLGWt5vcsvZKwh71XhFgKdlmBSwdRe_KghJuw8vjiwQOPM0-NZ6r8VgdQMgFK15vxnRwZkAYrvIvuOb17TQznj8VLrfZUdlXk6WiGfWVQSDGFDMDiA3jB4Slm7Hjr6u7Eu36QXmsSy55YXP9Uvfc', employeeId: '10004', email: 'ethan.harper@example.com', managerId: 'user-2', password: '44444', pin: '444444' },
  { id: 'user-5', name: 'Olivia Bennett', role: UserRole.EMPLOYEE, department: 'Design', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuACrRsvIIpt8jOUyxmn3wpRi23xKcBfJChepkixKdNwlXv4ldRndthYv-dyY12roM5CTGn6n2q-cZtLZYAIoyQNWrERGCQBjJdDdYtiHLnavpy22U0aQD49Nyzu92u-IDgW440C-JK5KsS8UyXNX450CQfTKqSeSupZJvcSilKSTqw5sDMx2Eca11txTShMCWSuUzqODFzTmRWZICClwl8GU2vwtLMMzAFJNrklj1cuzHsGCbj6ahh9KJIaybYjUQbsBrmFXj8E31M', employeeId: '10005', email: 'olivia.bennett@example.com', managerId: 'user-2', password: '55555', pin: '555555' },
  
  // New users from provided HTML
  { id: 'user-6', name: 'Sophia Bennett', role: UserRole.EMPLOYEE, department: 'Marketing', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDhhKqhQPmMwD36aqc1mNMiPDyf8XfA5xkQAP1KfE6MX2VLASFw-dMZd9lfFhVznTD-1rup8t0bYWZztu9G4rYmSi4z8PHmPc6A6b4Nq05H6FuVmQ-ei7a1GxBEWpORky6gasfcagjU8wTIptm_Mj4R2A32sQOHT7jIemiNrRyn-OJWWFtSi9n8z7sg7_HKGo-5XTJJexnIsDMvDj8N8cPfIHAp1as1gHHp1mQxgbgOLvKrEfBk6Gx7aWPawDbQaKartni2xBMjAXY', employeeId: '10006', email: 'sophia.bennett@example.com', managerId: 'user-2', password: '66666', pin: '666666' },
  { id: 'user-7', name: 'Liam Carter', role: UserRole.EMPLOYEE, department: 'Sales', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBDkrWWg53fJ6JOgk_4NUskNPrK6-7rNwiJM55-nr39icoAysQuSwaERoNR6usPSlvsNBOx8iZIgMv6MhOLoOFEQx07aSWz3mL2Balw_9_UwQXtmamLfxd7GMBJ7jDKhhX_x9iFCEyciA59167NqHxp00DQS_J1bXCau6zy52CJGcW0dMgKJsb36EYuNQ1jj8szCPIXNLGbMCSwmxGR_ECP76KQ53y2vvj5Rx1ZnyoSCoj0G5tvHcjS2tWkbgM6fAx9PL7rB-DF0ZI', employeeId: '10007', email: 'liam.carter@example.com', managerId: 'user-2', password: '77777', pin: '777777' },
  { id: 'user-8', name: 'Olivia Davis', role: UserRole.EMPLOYEE, department: 'Product', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuArZFBtrVrTItNSv4R3QPf__AGyhDhOS92M6avoJie54rIaKP83vXZOZyro0wZxtimcmwJaCyeiVpGIP4vWrCatDWfomEDC5hc8-usu9Bm4Y0r4hdvxi_wp8fDQSEN_-BjBQoYrK2A07s0Nl3BeiD4qFNm-jMKye4h1e_NiA-cUWduuDz2oVVrKxMLF2y1Iv2I4jNsSVybBzoYa93bTJ1o6uEBi3mnPiOMqavrrYtzH35w4MUVb7rq6VNlY6Sa6UTLa_wo2rl41hIQ', employeeId: '10008', email: 'olivia.davis@example.com', managerId: 'user-2', password: '88888', pin: '888888' },
  { id: 'user-9', name: 'Noah Evans', role: UserRole.EMPLOYEE, department: 'HR', avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBElGyrcCxsOWCfh8I5XmW4Q_roCtDm_tGLofQGMX3Z8rBDjfsYMFVFJsFJQ70ltIScW_yqrglPipNiN-f9ggwJhJele_XXUS4JVhphZjhoKHKetzQXDTUZmWWu5PQdc5726ZkNYuAns6FFupzTHDYBogd1EF10omnlwP3DXcWCADV-P6DpUEYQvNXVpibLYD-pzJ4keVIPYfH-kuoo6ctdK7TMJrEmf3NICo38HOOOwQQZz1gszNJXgfMoDGU5iPPqfx3NLKkEFQ8', employeeId: '10009', email: 'noah.evans@example.com', managerId: 'user-2', password: '99999', pin: '999999' },
];

export const CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Laptop', icon: 'laptop_chromebook' },
  { id: 'cat-2', name: 'Monitor', icon: 'desktop_windows' },
  { id: 'cat-3', name: 'Keyboard', icon: 'keyboard' },
  { id: 'cat-4', name: 'Mouse', icon: 'mouse' },
  { id: 'cat-5', name: 'Docking Station', icon: 'dock' },
  { id: 'cat-6', name: 'Headphones', icon: 'headphones' },
  { id: 'cat-8', name: 'Desktop', icon: 'desktop_mac' },
  { id: 'cat-9', name: 'Printer', icon: 'print' },
  { id: 'cat-7', name: 'Other', icon: 'devices_other' },
];

export const MODELS: Model[] = [
  { id: 'model-1', name: 'Dell Latitude 7420', modelNumber: 'LAT7420-123X', brand: 'Dell', categoryId: 'cat-1', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-Q0jBf8S22TbU-pCgoOC2mE2OpF__sBSwhI1FFPspN4oRJIc0YmdsbKaCNN_tgbiMVLKBQrQ7wYMm94NhgxUKe7wKndVnUZu_3JZGWnM-PvJdJhD8lpMlCILPHsmGTn6oCeQiLYM7NPPI_IWVJ1gGkWnwsW6o3jDRWQ49qcqy2FRCafdIGRNqjjfUV9dZXM9Tl7q7PC6F0RVODEnXp7DQ9fPcRVOiFFSeamk22xzs81BNtYyq-yVf4HHcxdLtUNq_fAckwvvza5U' },
  { id: 'model-2', name: 'Dell U2721DE', modelNumber: 'U2721DE', brand: 'Dell', categoryId: 'cat-2', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBksvGlhFH7ySiqCM4Sqfb64GdIXFuKlifKUsbQ4kRjcuTyhToOL0s51icZooX9vINv9TMNu-SRmIgOg_v_5SZ8MKscjneXzod1_seZYW0AOUz2bqFe8JGTsZNeef2YXSeNR79ORIGG5RNV6Bu_Mo1GpZvYPeXRsUHyBtMIbaACEubJ2uK5VHGB1wAjFUecnSZcrCWmjC7KxCwAjXz4GAZrKmHwi3PEbCJHFfvUvsoCQgKeTEK7JNdoRDaoHq2mep8IwcyZuSyx0s' },
  { id: 'model-3', name: 'MacBook Pro 14"', modelNumber: 'A2442', brand: 'Apple', categoryId: 'cat-1', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-Q0jBf8S22TbU-pCgoOC2mE2OpF__sBSwhI1FFPspN4oRJIc0YmdsbKaCNN_tgbiMVLKBQrQ7wYMm94NhgxUKe7wKndVnUZu_3JZGWnM-PvJdJhD8lpMlCILPHsmGTn6oCeQiLYM7NPPI_IWVJ1gGkWnwsW6o3jDRWQ49qcqy2FRCafdIGRNqjjfUV9dZXM9Tl7q7PC6F0RVODEnXp7DQ9fPcRVOiFFSeamk22xzs81BNtYyq-yVf4HHcxdLtUNq_fAckwvvza5U' },
  { id: 'model-4', name: 'Logitech MX Keys', modelNumber: '920-009295', brand: 'Logitech', categoryId: 'cat-3', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCAqd0p6tDArTI3qqzauzYjcW22PXuhxZmsQWMIPYELbVWOGF5eHMlEYcNKuiMOXlBuarJ9m9LW8cQIqtjFcqIlORBDxqw6vIg6PIDX8ANArawoiHvSyhsuMP3B06thIu_c-ihhI3ppc9Wzj1HWulaalx7VYDNOdDbT1yU1WSMGklhtxESWA9XK0BCV7s12KjtciV5NUsIEVQK4D0dc6Tmg9kvKW6sQzyLByeXXb99-q9X4W6lEgDreJ99g_C2bwpEu0DewdN8qZhY' },
  { id: 'model-5', name: 'LG UltraFine 5K', modelNumber: '27MD5KL-B', brand: 'LG', categoryId: 'cat-2', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBksvGlhFH7ySiqCM4Sqfb64GdIXFuKlifKUsbQ4kRjcuTyhToOL0s51icZooX9vINv9TMNu-SRmIgOg_v_5SZ8MKscjneXzod1_seZYW0AOUz2bqFe8JGTsZNeef2YXSeNR79ORIGG5RNV6Bu_Mo1GpZvYPeXRsUHyBtMIbaACEubJ2uK5VHGB1wAjFUecnSZcrCWmjC7KxCwAjXz4GAZrKmHwi3PEbCJHFfvUvsoCQgKeTEK7JNdoRDaoHq2mep8IwcyZuSyx0s' },
  { id: 'model-6', name: 'Logitech MX Master 3', modelNumber: '910-005694', brand: 'Logitech', categoryId: 'cat-4', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-9_X36E6Mh0GoQKbDbsR6maaTewkpEacma7FeboVSYP9eWagtnmDRwlUxVouRhP1hF_SGGeaiAL0T2x9T2WD2WcE9L6FH0oKOD3VE5d7U9MT9JWdwTL1FQqF_BLDhjyxaPCAa0t_f6q8OpaYV0gJbfawhTRFlTpjeMtFLLU8oss9vF5dqWUbjfXQNtFL579bTwDS11r_-gmLngroSeKGS9eNxc9Yk6R3a3j5vNNlPsewUsAhapFbyeIXtEiStQp4B1CbXb2yLZqs' },
];

export const COUNTRIES: Country[] = [
    { id: 'country-1', name: 'Togo' },
    { id: 'country-2', name: 'France' },
    { id: 'country-3', name: 'Sénégal' },
];

export const SITES: Site[] = [
    { id: 'site-1', name: 'Siège Lomé', countryId: 'country-1' },
    { id: 'site-2', name: 'Agence Kara', countryId: 'country-1' },
    { id: 'site-3', name: 'Bureau Paris', countryId: 'country-2' },
    { id: 'site-4', name: 'Hub Dakar', countryId: 'country-3' },
];

export const DEPARTMENTS: Department[] = [
    { id: 'dept-1', name: 'Finance', siteId: 'site-1' },
    { id: 'dept-2', name: 'IT', siteId: 'site-1' },
    { id: 'dept-3', name: 'Commercial', siteId: 'site-2' },
    { id: 'dept-4', name: 'Marketing Europe', siteId: 'site-3' },
];


export const INITIAL_EQUIPMENT: Equipment[] = [
  { id: 'eq-1', modelId: 'model-1', name: 'LPT-FIN-01', assetTag: 'ASSET-12345', status: EquipmentStatus.AVAILABLE, siteId: 'site-1', departmentId: 'dept-1', purchaseDate: '2023-01-15', warrantyStartDate: '2023-01-15', warrantyEndDate: '2026-01-14', os: 'Windows 11 Pro', ram: '16 Go', storage: '512 Go SSD', operationalStatus: 'Actif' },
  { id: 'eq-2', modelId: 'model-2', assetTag: 'ASSET-12346', status: EquipmentStatus.AVAILABLE, siteId: 'site-2', purchaseDate: '2023-02-20', warrantyStartDate: '2023-02-20', warrantyEndDate: '2025-02-19', operationalStatus: 'Actif' },
  { id: 'eq-3', modelId: 'model-3', name: 'MBP-JSMITH', assetTag: 'ASSET-22001', status: EquipmentStatus.ASSIGNED, siteId: 'site-3', purchaseDate: '2023-05-10', warrantyStartDate: '2023-05-10', warrantyEndDate: '2026-05-09', os: 'macOS Sonoma', ram: '16 Go', storage: '512 Go SSD', agentS1: '23.3.4.12', agentM42: 'Oui', agentME: 'Oui', operationalStatus: 'Actif' },
  { id: 'eq-4', modelId: 'model-4', assetTag: 'ASSET-22002', status: EquipmentStatus.ASSIGNED, siteId: 'site-3', operationalStatus: 'Actif' },
  { id: 'eq-5', modelId: 'model-5', assetTag: 'ASSET-12347', status: EquipmentStatus.IN_REPAIR, siteId: 'site-1', departmentId: 'dept-2', purchaseDate: '2022-11-01', warrantyStartDate: '2022-11-01', warrantyEndDate: '2024-10-31', operationalStatus: 'En réparation' },
  { id: 'eq-6', modelId: 'model-6', assetTag: 'ASSET-22003', status: EquipmentStatus.ASSIGNED, siteId: 'site-3', operationalStatus: 'Actif' },
];

export const INITIAL_ASSIGNMENTS: Assignment[] = [
    { 
        id: 'as-1', 
        action: FormAction.ASSIGN, 
        equipmentId: 'eq-3', 
        date: '2023-10-26', 
        userId: 'user-3', // Jane Smith
        managerId: 'user-2', // Robert Brown
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Placeholder
        validation: { it: true, manager: true, user: true },
        status: AssignmentStatus.APPROVED,
    },
    { 
        id: 'as-2', 
        action: FormAction.ASSIGN, 
        equipmentId: 'eq-4', 
        date: '2023-10-28', 
        userId: 'user-4', // Ethan Harper
        managerId: 'user-2', // Robert Brown
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Placeholder
        validation: { it: true, manager: true, user: true },
        status: AssignmentStatus.APPROVED,
    },
    { 
        id: 'as-3', 
        action: FormAction.ASSIGN, 
        equipmentId: 'eq-6', 
        date: '2023-10-27', 
        userId: 'user-5', // Olivia Bennett
        managerId: 'user-2', // Robert Brown
        signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // Placeholder
        validation: { it: true, manager: true, user: true },
        status: AssignmentStatus.APPROVED,
    }
];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Alice Admin',
    action: 'create',
    entityType: 'model',
    entityName: 'Dell Latitude 7420',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Alice Admin',
    action: 'create',
    entityType: 'equipment',
    entityName: 'Dell Latitude 7420 (ASSET-12345)',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user: 'Alice Admin',
    action: 'create',
    entityType: 'category',
    entityName: 'Laptop',
  },
];