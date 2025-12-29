import { Redirect } from "expo-router";

export default function Index() {
    return <Redirect href="acc_mod/landing" />; //MAIN SCREEN DISPLAY, just change it when debugging


    //JEANNEN'S DEVELOPMENT PART
    // HOMESCREEN: dash_mod/home | CURRENTLY WORKING: acc_mod/signupstudid

  
    //DHENIZE'S DEVELOPMENT PART
    // HOMESCREEN: dash_mod/home
    // CURRENTLY WORKING: ar_mod/ar_height, ar_mod/ar_result, items_mod/boys_unif_p, dash_mod/inbox, dash_mod/account, 
    // /stngs_mod/settings, /transact_mod/history, /transact_mod/checkout, transact_mod/qr_payment, transact_mod/ticket_gen
    // /tran_com/set_apptix, /tran_com/view_payimg, /stngs_mod/signlog_his
    // NOTE TO SELF: Keep an eye for some pages that needed fixes (mostly in Transaction & Settings)
}
