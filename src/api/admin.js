import client from './client';

export const login = (email, password) =>
  client.post('/admin/login', { email, password });

export const getStats = () => client.get('/admin/getStats');
export const getUserGrowth = () => client.get('/admin/getUserGrowth');
export const getUsersByRegion = () => client.get('/admin/getUsersByRegion');
export const getCampaigns = () => client.get('/admin/getCampaigns');
export const getUsers = () => client.get('/admin/getUsers');
export const getWalletStats = () => client.get('/admin/getWalletStats');
export const getApplicationsPerCampaign = () => client.get('/admin/getApplicationsPerCampaign');
export const filterCreators = (params) => client.get('/admin/filterCreators', { params });
export const getIndustries = () => client.get('/admin/industries');
export const getJobs = (params) => client.get('/admin/getJobs', { params });

// Content review endpoints
export const getSubmissions = (params) => client.get('/admin/getSubmissions', { params });
export const approveSubmission = (interestId) => client.post('/jobs/approveWorkDone', { interest_id: interestId });
export const requestRevision = (interestId, note) => client.post('/jobs/request-revision', { interest_id: interestId, note });

// Financial dashboard
export const getFinancialDashboard = () => client.get('/admin/financialDashboard');
export const getUsdWithdrawals = (params) => client.get('/admin/usdWithdrawals', { params });
export const processUsdWithdrawal = (transactionId, action, note) =>
  client.post('/admin/processUsdWithdrawal', { transaction_id: transactionId, action, note });

// Delayed campaigns
export const getDelayedCampaigns = () => client.get('/admin/delayedCampaigns');

// Community feed
export const getAdminCommunityFeed = (params) => client.get('/admin/communityFeed', { params });
