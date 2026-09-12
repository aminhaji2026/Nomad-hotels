import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from './components/AdminShell'
import { PageTransition } from './components/PageTransition'
import { RequireAuth } from './components/RequireAuth'
import {
  AdminBookingsPage,
  AdminDashboardPage,
  AdminDuffelPage,
  AdminHotelsPage,
  AdminModulesPage,
  AdminPaymentsPage,
  AdminSettingsPage,
  AdminUsersPage,
} from './pages/admin/AdminPages'
import {
  AdminAdsPage,
  AdminAuditPage,
  AdminCmsPage,
  AdminCommissionsPage,
  AdminCustomersPage,
  AdminDestinationsPage,
  AdminFraudPage,
  AdminInventoryPage,
  AdminLanguagesPage,
  AdminLedgerPage,
  AdminLoyaltyPage,
  AdminNotificationsPage,
  AdminOnboardingPage,
  AdminPayoutsPage,
  AdminPromotionsPage,
  AdminRatesPage,
  AdminRefundsPage,
  AdminReportsPage,
  AdminReviewsPage,
  AdminRolesPage,
  AdminSupportPage,
  AdminTaxesPage,
  AdminTaxonomyPage,
} from './pages/admin/AdminPlatformPages'
import { HostPage } from './pages/HostPage'
import {
  HotelBookingsPage,
  HotelCalendarPage,
  HotelDashboardPage,
  HotelMessagesPage,
  HotelPropertyPage,
  HotelRoomsPage,
} from './pages/hotel/HotelAdminPages'
import { StaffLoginPage } from './pages/StaffLoginPage'

/** Hotel + platform ops console — separate host from the guest app. */
export function OpsApp() {
  return (
    <PageTransition>
      <Routes>
        <Route path="/" element={<Navigate to="/staff/login" replace />} />
        <Route path="/login" element={<Navigate to="/staff/login" replace />} />
        <Route path="/staff/login" element={<StaffLoginPage />} />
        <Route
          path="/host"
          element={
            <RequireAuth roles={['hotel_admin', 'admin']}>
              <HostPage />
            </RequireAuth>
          }
        />

        <Route
          path="/hotel-admin"
          element={
            <RequireAuth roles={['hotel_admin', 'admin']}>
              <AdminShell variant="hotel" />
            </RequireAuth>
          }
        >
          <Route index element={<HotelDashboardPage />} />
          <Route path="bookings" element={<HotelBookingsPage />} />
          <Route path="rooms" element={<HotelRoomsPage />} />
          <Route path="calendar" element={<HotelCalendarPage />} />
          <Route path="property" element={<HotelPropertyPage />} />
          <Route path="messages" element={<HotelMessagesPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <RequireAuth roles={['admin']}>
              <AdminShell variant="platform" />
            </RequireAuth>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="modules" element={<AdminModulesPage />} />
          <Route path="hotels" element={<AdminHotelsPage />} />
          <Route path="onboarding" element={<AdminOnboardingPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="rates" element={<AdminRatesPage />} />
          <Route path="commissions" element={<AdminCommissionsPage />} />
          <Route path="refunds" element={<AdminRefundsPage />} />
          <Route path="payouts" element={<AdminPayoutsPage />} />
          <Route path="ledger" element={<AdminLedgerPage />} />
          <Route path="promotions" element={<AdminPromotionsPage />} />
          <Route path="ads" element={<AdminAdsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="cms" element={<AdminCmsPage />} />
          <Route path="destinations" element={<AdminDestinationsPage />} />
          <Route path="taxonomy" element={<AdminTaxonomyPage />} />
          <Route path="support" element={<AdminSupportPage />} />
          <Route path="fraud" element={<AdminFraudPage />} />
          <Route path="notifications" element={<AdminNotificationsPage />} />
          <Route path="languages" element={<AdminLanguagesPage />} />
          <Route path="taxes" element={<AdminTaxesPage />} />
          <Route path="loyalty" element={<AdminLoyaltyPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="audit" element={<AdminAuditPage />} />
          <Route path="duffel" element={<AdminDuffelPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/staff/login" replace />} />
      </Routes>
    </PageTransition>
  )
}
