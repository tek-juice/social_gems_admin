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
