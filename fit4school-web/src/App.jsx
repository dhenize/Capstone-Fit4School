import { Routes, Route } from 'react-router-dom';
import AAccMod from './a_pages/a_acc_mod/a_acc_mod.jsx';
import AReports from './a_pages/a_reports/a_reports.jsx';
import AOrders from './a_pages/a_orders/a_orders.jsx';
import AUniforms from './a_pages/a_uniforms/a_uniforms.jsx';
import ATransactions from './a_pages/a_transactions/a_transactions.jsx';
import AcDashboard from './ac_pages/ac_dashboard/ac_dashboard.jsx';
import AcPayments from './ac_pages/ac_payments/ac_payments.jsx';
import EnterMail from './al_forgotpass/entermail/entermail.jsx';
import AForgotPass from './al_forgotpass/a_forgotpass/a_forgotpass.jsx';
import BForgotPass from './al_forgotpass/b_forgotpass/b_forgotpass.jsx';
import SupAccMod from './sup_ad_pages/sup_acc_mod/sup_acc_mod.jsx';
import SupAdAdmin from './sup_ad_pages/sup_ad_admin/sup_ad_admin.jsx';
import SupAdAccountant from './sup_ad_pages/sup_ad_accountant/sup_ad_accountant.jsx';
import SupAdUser from './sup_ad_pages/sup_ad_user/sup_ad_user.jsx';
import AUniformsAdd from './a_pages/a_uniforms_add/a_uniforms_add.jsx';
import SupStudent from './sup_ad_pages/sup_student_user/sup_student.jsx';
import AReturns from './a_pages/a_returns/a_returns.jsx'; 
import AdminProfile from './components/admin_profile.jsx';
import AccProfile from './components/acc_profile.jsx';

function App(){
  return(
    <>
      <Routes>
        <Route path="/" element={<AAccMod />} />
        <Route path="/a_acc_mod" element={<AAccMod />} />
        <Route path="/a_reports" element={<AReports />} />
        <Route path="/a_orders" element={<AOrders />} />
        <Route path="/a_uniforms" element={<AUniforms />} />
        <Route path="/a_transactions" element={<ATransactions />} />
        <Route path="/admin_profile" element={<AdminProfile />} />
        <Route path="/ac_dashboard" element={<AcDashboard />} />
        <Route path="/ac_payments" element={<AcPayments />} />
        <Route path="/acc_profile" element={<AccProfile />} />
        <Route path="/entermail" element={<EnterMail />} />
        <Route path="/a_forgotpass" element={<AForgotPass />} />
        <Route path="/b_forgotpass" element={<BForgotPass />} />
        <Route path="/sup_acc_mod" element={<SupAccMod />} />
        <Route path="/sup_ad_admin" element={<SupAdAdmin />} /> 
        <Route path="/sup_ad_accountant" element={<SupAdAccountant />} />
        <Route path="/sup_ad_user" element={<SupAdUser />} /> 
        <Route path="/sup_student" element={<SupStudent />} />
        <Route path="/a_uniforms_add" element={<AUniformsAdd />} />
        <Route path="/a_returns" element={<AReturns />} />
      </Routes>
    </>
  );
}

export default App;