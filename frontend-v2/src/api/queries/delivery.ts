import { useQuery } from '@tanstack/react-query'
import {
  fetchActiveOrders,
  fetchWalletSummary,
  fetchBankAccounts,
  fetchCustomerAddresses,
  fetchRestaurantBranches,
  fetchDeliveryDashboard,
  fetchDeliveryOrderHistory,
} from '@/api/services/delivery'

export function useDeliveryActiveOrders() {
  return useQuery({
    queryKey: ['delivery', 'active'],
    queryFn: fetchActiveOrders,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  })
}

export function useDeliveryWallet() {
  return useQuery({
    queryKey: ['delivery', 'wallet'],
    queryFn: fetchWalletSummary,
    staleTime: 60_000,
  })
}

export function useDeliveryDashboard() {
  return useQuery({
    queryKey: ['delivery', 'dashboard'],
    queryFn: fetchDeliveryDashboard,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useDeliveryOrderHistory() {
  return useQuery({
    queryKey: ['delivery', 'history'],
    queryFn: fetchDeliveryOrderHistory,
    staleTime: 60_000,
  })
}

export function useDeliveryBankAccounts() {
  return useQuery({
    queryKey: ['delivery', 'bank-accounts'],
    queryFn: fetchBankAccounts,
    staleTime: 60_000,
  })
}

export function useDeliveryCustomerAddresses() {
  return useQuery({
    queryKey: ['delivery', 'customer-addresses'],
    queryFn: fetchCustomerAddresses,
    staleTime: 60_000,
  })
}

export function useDeliveryRestaurantBranches() {
  return useQuery({
    queryKey: ['delivery', 'restaurant-branches'],
    queryFn: fetchRestaurantBranches,
    staleTime: 5 * 60_000,
  })
}
