-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 18, 2025 at 07:16 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cap_fit4school`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_accountant`
--

CREATE TABLE `tbl_accountant` (
  `acc_id` varchar(10) NOT NULL,
  `fname` varchar(200) NOT NULL,
  `lname` varchar(200) NOT NULL,
  `gen_roles` varchar(20) NOT NULL DEFAULT 'Accountant',
  `created_at` datetime DEFAULT current_timestamp(),
  `acc_status` varchar(20) NOT NULL DEFAULT 'Active',
  `email` varchar(150) NOT NULL,
  `password` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_accountant`
--

INSERT INTO `tbl_accountant` (`acc_id`, `fname`, `lname`, `gen_roles`, `created_at`, `acc_status`, `email`, `password`) VALUES
('ACC2025001', 'Jeannen', 'Basay', 'Accountant', '2025-11-18 01:41:26', 'Active', 'accountant1@gmail.com', 'accpass123');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_acc_archv`
--

CREATE TABLE `tbl_acc_archv` (
  `arch_id` varchar(20) NOT NULL,
  `account_id` varchar(20) NOT NULL,
  `account_type` enum('user','admin','accountant') NOT NULL,
  `fname` varchar(200) NOT NULL,
  `lname` varchar(200) NOT NULL,
  `archived_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_admin`
--

CREATE TABLE `tbl_admin` (
  `admin_id` varchar(10) NOT NULL,
  `fname` varchar(200) NOT NULL,
  `lname` varchar(200) NOT NULL,
  `gen_roles` varchar(20) NOT NULL DEFAULT 'Admin',
  `created_at` datetime DEFAULT current_timestamp(),
  `adm_status` varchar(20) NOT NULL DEFAULT 'Active',
  `email` varchar(150) NOT NULL,
  `password` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_admin`
--

INSERT INTO `tbl_admin` (`admin_id`, `fname`, `lname`, `gen_roles`, `created_at`, `adm_status`, `email`, `password`) VALUES
('ADM2025001', 'Julia', 'Fajardo', 'Admin', '2025-11-18 01:40:45', 'Active', 'admin1@gmail.com', 'adminpass123');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_itemlist`
--

CREATE TABLE `tbl_itemlist` (
  `item_id` varchar(50) NOT NULL,
  `item_name` varchar(150) NOT NULL,
  `category` enum('Polo','Pants','Shorts','Blouse','Skirt','Vest','Full','PE Full','PE Shirt','PE Jogger') NOT NULL,
  `gender` enum('Boys','Girls','Unisex') NOT NULL,
  `grade_lvl` enum('Kindergarten','Elementary','Junior Highschool') NOT NULL,
  `unif_pic` varchar(2000) NOT NULL,
  `size` varchar(10) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `chest` decimal(5,2) NOT NULL,
  `length` decimal(5,2) NOT NULL,
  `hips` decimal(5,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_itemlist`
--

INSERT INTO `tbl_itemlist` (`item_id`, `item_name`, `category`, `gender`, `grade_lvl`, `unif_pic`, `size`, `price`, `chest`, `length`, `hips`) VALUES
('1-Bls-G-Elem-S', 'Blouse Girls Elem S', 'Blouse', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'S', 300.00, 64.00, 46.00, 0.00),
('1-Bls-G-JHS-S', 'Blouse Girls JHS S', 'Blouse', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'S', 360.00, 70.00, 50.00, 0.00),
('1-Bls-G-Kndr-S', 'Blouse Girls Kndr S', 'Blouse', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'S', 200.00, 58.00, 40.00, 0.00),
('1-Pants-B-Elem-S', 'Pants Boys Elem S', 'Pants', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/3ntac05al9mudcgbt1mto/pants.jpg?rlkey=fcc3lxttfig5sxhcauuwna0py&st=656qvw6p&raw=1', 'S', 300.00, 0.00, 0.00, 64.00),
('1-Pants-B-JHS-S', 'Pants Boys JHS S', 'Pants', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/3ntac05al9mudcgbt1mto/pants.jpg?rlkey=fcc3lxttfig5sxhcauuwna0py&st=656qvw6p&raw=1', 'S', 350.00, 0.00, 0.00, 66.00),
('1-Pckg-B-Elem-S', 'Pckg Boys Elem S', 'PE Full', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'S', 600.00, 64.00, 46.00, 64.00),
('1-Pckg-B-JHS-S', 'Pckg Boys JHS S', 'Full', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'S', 650.00, 66.00, 48.00, 66.00),
('1-Pckg-B-Kndr-S', 'Pckg Boys Kndr S', 'Full', 'Boys', 'Kindergarten', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'S', 500.00, 60.00, 45.00, 60.00),
('1-Pckg-G-Elem-S', 'Pckg Girls Elem S', 'Full', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'S', 600.00, 64.00, 46.00, 66.00),
('1-Pckg-G-JHS-S', 'Pckg Girls JHS S', 'Full', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'S', 700.00, 70.00, 50.00, 72.00),
('1-Pckg-G-Kndr-S', 'Pckg Girls Kndr S', 'Full', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'S', 500.00, 60.00, 44.00, 60.00),
('1-PE-B-Kndr-S', 'PE Pckg Boys Kndr S', 'PE Full', 'Boys', 'Kindergarten', 'no_image', 'S', 500.00, 62.00, 44.00, 62.00),
('1-PE-G-JHS-S', 'PE Pckg Girls JHS S', 'PE Full', 'Girls', 'Junior Highschool', 'no_image', 'S', 650.00, 74.00, 52.00, 74.00),
('1-PE-G-Kndr-S', 'PE Pckg Girls Kndr S', 'PE Full', 'Girls', 'Kindergarten', 'no_image', 'S', 250.00, 62.00, 44.00, 62.00),
('1-PEJogger-B-Elem-S', 'PE Jogger Boys Elem S', 'PE Jogger', 'Boys', 'Elementary', 'no_image', 'S', 260.00, 0.00, 0.00, 64.00),
('1-PEJogger-B-JHS-S', 'PE Jogger Boys JHS S', 'PE Jogger', 'Boys', 'Junior Highschool', 'no_image', 'S', 300.00, 0.00, 0.00, 64.00),
('1-PEjogger-B-Kndr-S', 'PE Jogger Boys Kndr S', 'PE Jogger', 'Boys', 'Kindergarten', 'no_image', 'S', 300.00, 0.00, 0.00, 62.00),
('1-PEJogger-G-Elem-S', 'PE Jogger Girls Elem S', 'PE Jogger', 'Girls', 'Elementary', 'no_image', 'S', 300.00, 0.00, 0.00, 70.00),
('1-PEJogger-G-JHS-S', 'PE Jogger Girls JHS S', 'PE Jogger', 'Girls', 'Junior Highschool', 'no_image', 'S', 330.00, 0.00, 0.00, 76.00),
('1-PEJogger-G-Kndr-S', 'PE Jogger Girls Kndr S', 'PE Jogger', 'Girls', 'Kindergarten', 'no_image', 'S', 250.00, 0.00, 0.00, 62.00),
('1-PEPckg-G-Elem-S', 'PE Pckg Girls Elem S', 'PE Full', 'Girls', 'Elementary', 'no_image', 'S', 520.00, 64.00, 46.00, 70.00),
('1-PEShirt-B-Elem-S', 'PE Shirt Boys Elem S', 'PE Shirt', 'Boys', 'Elementary', 'no_image', 'S', 250.00, 64.00, 46.00, 0.00),
('1-PEShirt-B-JHS-S', 'PE Shirt Boys JHS S', 'PE Shirt', 'Boys', 'Kindergarten', 'no_image', 'S', 250.00, 64.00, 46.00, 0.00),
('1-PEshirt-B-Kndr-S', 'PE Shirt Boys Kndr S', 'PE Shirt', 'Boys', 'Kindergarten', 'no_image', 'S', 200.00, 62.00, 44.00, 0.00),
('1-PEShirt-G-Elem-S', 'PE Shirt Girls Elem S', 'PE Shirt', 'Girls', 'Elementary', 'no_image', 'S', 250.00, 64.00, 46.00, 0.00),
('1-PEShirt-G-JHS-S', 'PE Shirt Girls JHS S', 'PE Shirt', 'Girls', 'Junior Highschool', 'no_image', 'S', 320.00, 74.00, 52.00, 0.00),
('1-Polo-B-Elem-S', 'Polo Boys Elem S', 'Polo', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'S', 300.00, 64.00, 46.00, 0.00),
('1-Polo-B-JHS-S', 'Polo Boys JHS S', 'Polo', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'S', 350.00, 66.00, 48.00, 0.00),
('1-Polo-B-Kndr-S', 'Polo Boys Kndr S', 'Polo', 'Boys', 'Kindergarten', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'S', 200.00, 60.00, 45.00, 0.00),
('1-Short-B-Kndr-S', 'Short Boys Kndr S', 'Shorts', 'Boys', 'Kindergarten', 'no_image', 'S', 150.00, 0.00, 0.00, 58.00),
('1-Skrt-G-Elem-S', 'Skirt Girls Elem S', 'Skirt', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'S', 300.00, 0.00, 0.00, 70.00),
('1-Skrt-G-JHS-S', 'Skirt Girls JHS S', 'Skirt', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'S', 360.00, 0.00, 0.00, 74.00),
('1-Skrt-G-Kndr-S', 'Skirt Girls Kndr S', 'Skirt', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'S', 150.00, 0.00, 0.00, 54.00),
('2-Bls-G-Elem-M', 'Blouse Girls Elem M', 'Blouse', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'M', 320.00, 66.00, 48.00, 0.00),
('2-Bls-G-JHS-M', 'Blouse Girls JHS M', 'Blouse', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'M', 380.00, 72.00, 52.00, 0.00),
('2-Bls-G-Kndr-M', 'Blouse Girls Kndr M', 'Blouse', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'M', 220.00, 60.00, 42.00, 0.00),
('2-Pants-B-Elem-M', 'Pants Boys Elem M', 'Pants', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/3ntac05al9mudcgbt1mto/pants.jpg?rlkey=fcc3lxttfig5sxhcauuwna0py&st=656qvw6p&raw=1', 'M', 320.00, 0.00, 0.00, 66.00),
('2-Pants-B-JHS-M', 'Pants Boys JHS M', 'Pants', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/3ntac05al9mudcgbt1mto/pants.jpg?rlkey=fcc3lxttfig5sxhcauuwna0py&st=656qvw6p&raw=1', 'M', 370.00, 0.00, 0.00, 68.00),
('2-Pckg-B-Elem-M', 'Pckg Boys Elem M', 'PE Full', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'M', 620.00, 66.00, 48.00, 66.00),
('2-Pckg-B-JHS-M', 'Pckg Boys JHS M', 'Full', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'M', 670.00, 68.00, 50.00, 68.00),
('2-Pckg-B-Kndr-M', 'Pckg Boys Kndr M', 'Full', 'Boys', 'Kindergarten', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'M', 520.00, 62.00, 45.00, 60.00),
('2-Pckg-G-Elem-M', 'Pckg Girls Elem M', 'Full', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'M', 620.00, 66.00, 48.00, 68.00),
('2-Pckg-G-JHS-M', 'Pckg Girls JHS M', 'Full', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'M', 720.00, 72.00, 52.00, 74.00),
('2-Pckg-G-Kndr-M', 'Pckg Girls Kndr M', 'Full', 'Girls', 'Kindergarten', 'no_image', 'M', 520.00, 62.00, 46.00, 62.00),
('2-PE-B-Kndr-M', 'PE Pckg Boys Kndr M', 'PE Full', 'Boys', 'Kindergarten', 'no_image', 'M', 520.00, 64.00, 46.00, 64.00),
('2-PE-G-JHS-M', 'PE Pckg Girls JHS M', 'PE Full', 'Girls', 'Junior Highschool', 'no_image', 'M', 670.00, 76.00, 54.00, 76.00),
('2-PE-G-Kndr-M', 'PE Pckg Girls Kndr M', 'PE Full', 'Girls', 'Kindergarten', 'no_image', 'M', 260.00, 64.00, 46.00, 64.00),
('2-PEJogger-B-Elem-M', 'PE Jogger Boys Elem M', 'PE Jogger', 'Boys', 'Elementary', 'no_image', 'M', 270.00, 0.00, 0.00, 66.00),
('2-PEJogger-B-JHS-M', 'PE Jogger Boys JHS M', 'PE Jogger', 'Boys', 'Junior Highschool', 'no_image', 'M', 320.00, 0.00, 0.00, 66.00),
('2-PEjogger-B-Kndr-M', 'PE Jogger Boys Kndr M', 'PE Jogger', 'Boys', 'Kindergarten', 'no_image', 'M', 320.00, 0.00, 0.00, 64.00),
('2-PEJogger-G-Elem-M', 'PE Jogger Girls Elem M', 'PE Jogger', 'Girls', 'Elementary', 'no_image', 'M', 320.00, 0.00, 0.00, 72.00),
('2-PEJogger-G-JHS-M', 'PE Jogger Girls JHS M', 'PE Jogger', 'Girls', 'Junior Highschool', 'no_image', 'M', 350.00, 0.00, 0.00, 78.00),
('2-PEJogger-G-Kndr-M', 'PE Jogger Girls Kndr M', 'PE Jogger', 'Girls', 'Kindergarten', 'no_image', 'M', 260.00, 0.00, 0.00, 64.00),
('2-PEPckg-G-Elem-M', 'PE Pckg Girls Elem M', 'PE Full', 'Girls', 'Elementary', 'no_image', 'M', 540.00, 66.00, 48.00, 72.00),
('2-PEShirt-B-Elem-M', 'PE Shirt Boys Elem M', 'PE Shirt', 'Boys', 'Elementary', 'no_image', 'M', 260.00, 66.00, 48.00, 0.00),
('2-PEShirt-B-JHS-M', 'PE Shirt Boys JHS M', 'PE Shirt', 'Boys', 'Junior Highschool', 'no_image', 'M', 260.00, 66.00, 48.00, 0.00),
('2-PEshirt-B-Kndr-M', 'PE Shirt Boys Kndr M', 'PE Shirt', 'Boys', 'Kindergarten', 'no_image', 'M', 220.00, 64.00, 46.00, 0.00),
('2-PEShirt-G-Elem-M', 'PE Shirt Girls Elem M', 'PE Shirt', 'Girls', 'Elementary', 'no_image', 'M', 260.00, 66.00, 48.00, 0.00),
('2-PEShirt-G-JHS-M', 'PE Shirt Girls JHS M', 'PE Shirt', 'Girls', 'Junior Highschool', 'no_image', 'M', 340.00, 76.00, 54.00, 0.00),
('2-Polo-B-Elem-M', 'Polo Boys Elem M', 'Polo', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'M', 320.00, 66.00, 48.00, 0.00),
('2-Polo-B-JHS-M', 'Polo Boys JHS M', 'Polo', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'M', 370.00, 68.00, 50.00, 0.00),
('2-Polo-B-Kndr-M', 'Polo Boys Kndr M', 'Polo', 'Boys', 'Kindergarten', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'M', 220.00, 62.00, 47.00, 0.00),
('2-Short-B-Kndr-M', 'Short Boys Kndr M', 'Shorts', 'Boys', 'Kindergarten', 'no_image', 'M', 160.00, 0.00, 0.00, 60.00),
('2-Skrt-G-Elem-M', 'Skirt Girls Elem M', 'Skirt', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'M', 320.00, 0.00, 0.00, 72.00),
('2-Skrt-G-JHS-M', 'Skirt Girls JHS M', 'Skirt', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'M', 380.00, 0.00, 0.00, 76.00),
('2-Skrt-G-Kndr-M', 'Skirt Girls Kndr M', 'Skirt', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'M', 160.00, 0.00, 0.00, 56.00),
('3-Bls-G-Elem-L', 'Blouse Girls Elem L', 'Blouse', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'L', 325.00, 68.00, 50.00, 0.00),
('3-Bls-G-JHS-L', 'Blouse Girls JHS L', 'Blouse', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'L', 400.00, 74.00, 54.00, 0.00),
('3-Bls-G-Kndr-L', 'Blouse Girls Kndr L', 'Blouse', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'L', 225.00, 62.00, 44.00, 0.00),
('3-Pants-B-Elem-L', 'Pants Boys Elem L', 'Pants', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/3ntac05al9mudcgbt1mto/pants.jpg?rlkey=fcc3lxttfig5sxhcauuwna0py&st=656qvw6p&raw=1', 'L', 325.00, 0.00, 0.00, 68.00),
('3-Pants-B-JHS-L', 'Pants Boys JHS L', 'Pants', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/3ntac05al9mudcgbt1mto/pants.jpg?rlkey=fcc3lxttfig5sxhcauuwna0py&st=656qvw6p&raw=1', 'L', 380.00, 0.00, 0.00, 70.00),
('3-Pckg-B-Elem-L', 'Pckg Boys Elem L', 'PE Full', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'L', 625.00, 68.00, 50.00, 68.00),
('3-Pckg-B-JHS-L', 'Pckg Boys JHS L', 'Full', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'L', 680.00, 70.00, 52.00, 70.00),
('3-Pckg-B-Kndr-L', 'Pckg Boys Kndr L', 'Full', 'Boys', 'Kindergarten', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'L', 525.00, 64.00, 49.00, 64.00),
('3-Pckg-G-Elem-L', 'Pckg Girls Elem L', 'Full', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'L', 625.00, 68.00, 50.00, 70.00),
('3-Pckg-G-JHS-L', 'Pckg Girls JHS L', 'Full', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'L', 740.00, 74.00, 54.00, 76.00),
('3-Pckg-G-Kndr-L', 'Pckg Girls Kndr L', 'Full', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/gaw7hjsods4d5fja5edfn/blouse-1.jpg?rlkey=4r4ineyewjx16te52g9hgio0p&st=eactj77d&raw=1', 'L', 525.00, 0.00, 0.00, 0.00),
('3-PE-B-Kndr-L', 'PE Pckg Boys Kndr L', 'PE Full', 'Boys', 'Kindergarten', 'no_image', 'L', 525.00, 66.00, 48.00, 66.00),
('3-PE-G-JHS-L', 'PE Pckg Girls JHS L', 'PE Full', 'Girls', 'Junior Highschool', 'no_image', 'L', 690.00, 78.00, 56.00, 78.00),
('3-PE-G-Kndr-L', 'PE Pckg Girls Kndr M', 'PE Full', 'Girls', 'Kindergarten', 'no_image', 'L', 265.00, 66.00, 48.00, 66.00),
('3-PEJogger-B-Elem-L', 'PE Jogger Boys Elem L', 'PE Jogger', 'Boys', 'Elementary', 'no_image', 'L', 280.00, 0.00, 0.00, 68.00),
('3-PEJogger-B-JHS-L', 'PE Jogger Boys JHS L', 'PE Jogger', 'Boys', 'Junior Highschool', 'no_image', 'L', 330.00, 0.00, 0.00, 68.00),
('3-PEjogger-B-Kndr-L', 'PE Jogger Boys Kndr L', 'PE Jogger', 'Boys', 'Kindergarten', 'no_image', 'L', 325.00, 0.00, 0.00, 66.00),
('3-PEJogger-G-Elem-L', 'PE Jogger Girls Elem L', 'PE Jogger', 'Girls', 'Elementary', 'no_image', 'L', 325.00, 0.00, 0.00, 74.00),
('3-PEJogger-G-JHS-L', 'PE Jogger Girls JHS L', 'PE Jogger', 'Girls', 'Junior Highschool', 'no_image', 'L', 370.00, 0.00, 0.00, 80.00),
('3-PEJogger-G-Kndr-L', 'PE Jogger Girls Kndr L', 'PE Jogger', 'Girls', 'Kindergarten', 'no_image', 'L', 265.00, 0.00, 0.00, 66.00),
('3-PEPckg-G-Elem-L', 'PE Pckg Girls Elem L', 'PE Full', 'Girls', 'Elementary', 'no_image', 'L', 560.00, 68.00, 50.00, 74.00),
('3-PEShirt-B-Elem-L', 'PE Shirt Boys Elem L', 'PE Shirt', 'Boys', 'Elementary', 'no_image', 'L', 270.00, 68.00, 50.00, 0.00),
('3-PEShirt-B-JHS-L', 'PE Shirt Boys JHS L', 'PE Shirt', 'Boys', 'Junior Highschool', 'no_image', 'L', 270.00, 68.00, 50.00, 0.00),
('3-PEshirt-B-Kndr-L', 'PE Shirt Boys Kndr L', 'PE Shirt', 'Boys', 'Kindergarten', 'no_image', 'L', 225.00, 66.00, 48.00, 0.00),
('3-PEShirt-G-Elem-L', 'PE Shirt Girls Elem L', 'PE Shirt', 'Girls', 'Elementary', 'no_image', 'L', 270.00, 68.00, 50.00, 0.00),
('3-PEShirt-G-JHS-L', 'PE Shirt Girls JHS L', 'PE Shirt', 'Girls', 'Junior Highschool', 'no_image', 'L', 360.00, 78.00, 56.00, 0.00),
('3-Polo-B-Elem-L', 'Polo Boys Elem L', 'Polo', 'Boys', 'Elementary', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'L', 325.00, 68.00, 50.00, 0.00),
('3-Polo-B-JHS-L', 'Polo Boys JHS L', 'Polo', 'Boys', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'L', 380.00, 70.00, 52.00, 0.00),
('3-Polo-B-Kndr-L', 'Polo Boys Kndr L', 'Polo', 'Boys', 'Kindergarten', 'https://www.dropbox.com/scl/fi/4hizfm2pv79qmtqo3c9z7/polo.jpg?rlkey=hie7s2y1rzdx7bmvdwk5ro6s2&st=gom5dhs8&raw=1', 'L', 225.00, 64.00, 49.00, 0.00),
('3-Short-B-Kndr-L', 'Short Boys Kndr L', 'Shorts', 'Boys', 'Kindergarten', 'no_image', 'L', 165.00, 0.00, 0.00, 62.00),
('3-Skrt-G-Elem-L', 'Skirt Girls Elem L', 'Skirt', 'Girls', 'Elementary', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'L', 325.00, 0.00, 0.00, 74.00),
('3-Skrt-G-JHS-L', 'Skirt Girls JHS L', 'Skirt', 'Girls', 'Junior Highschool', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'L', 400.00, 0.00, 0.00, 78.00),
('3-Skrt-G-Kndr-L', 'Skirt Girls Kndr L', 'Skirt', 'Girls', 'Kindergarten', 'https://www.dropbox.com/scl/fi/3nr5liof73cnfwzrgsiv4/skirt.jpg?rlkey=5nmtok900w7vtv7ulwy9726g6&st=ur0uqjgs&raw=1', 'L', 165.00, 0.00, 0.00, 58.00);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_item_images`
--

CREATE TABLE `tbl_item_images` (
  `img_id` int(11) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `img_url` varchar(300) NOT NULL,
  `sort_order` int(11) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order`
--

CREATE TABLE `tbl_order` (
  `order_id` varchar(20) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `quantity` int(10) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `pay_method` enum('Cash','Bank','Online') NOT NULL,
  `payment_pic` varchar(500) DEFAULT NULL,
  `order_date` datetime NOT NULL DEFAULT current_timestamp(),
  `app_date` date NOT NULL,
  `app_time` time NOT NULL,
  `qr_code` varchar(250) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_order_archive`
--

CREATE TABLE `tbl_order_archive` (
  `ordrarch_id` varchar(20) NOT NULL,
  `confirm_id` varchar(20) NOT NULL,
  `arch_datetime` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_ordrconfirm`
--

CREATE TABLE `tbl_ordrconfirm` (
  `confirm_id` varchar(20) NOT NULL,
  `pay_id` varchar(20) NOT NULL,
  `admin_id` varchar(20) NOT NULL,
  `verified_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_stud`
--

CREATE TABLE `tbl_stud` (
  `student_id` varchar(10) NOT NULL,
  `fname` varchar(200) NOT NULL,
  `lname` varchar(200) NOT NULL,
  `gender` enum('male','female') NOT NULL,
  `sch_level` enum('kindergarten','elementary','junior highschool') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_stud`
--

INSERT INTO `tbl_stud` (`student_id`, `fname`, `lname`, `gender`, `sch_level`) VALUES
('20241001', 'Sophia', 'Garcia', 'female', 'elementary'),
('20241002', 'Liam', 'Chen', 'male', 'kindergarten'),
('20241003', 'Emma', 'Rodriguez', 'female', 'junior highschool'),
('20241004', 'Noah', 'Smith', 'male', 'elementary'),
('20241005', 'Olivia', 'Johnson', 'female', 'kindergarten'),
('20241006', 'Lucas', 'Williams', 'male', 'junior highschool'),
('20241007', 'Ava', 'Brown', 'female', 'elementary'),
('20241008', 'Mason', 'Davis', 'male', 'kindergarten'),
('20241009', 'Isabella', 'Miller', 'female', 'junior highschool'),
('20241010', 'Ethan', 'Wilson', 'male', 'elementary');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_transact`
--

CREATE TABLE `tbl_transact` (
  `pay_id` varchar(20) NOT NULL,
  `order_id` varchar(20) NOT NULL,
  `acc_id` varchar(20) NOT NULL,
  `pay_datetime` datetime DEFAULT current_timestamp(),
  `pay_status` enum('To Pay','Paid','Void') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user`
--

CREATE TABLE `tbl_user` (
  `user_id` varchar(20) NOT NULL,
  `fname` varchar(150) NOT NULL,
  `lname` varchar(150) NOT NULL,
  `roles` enum('parent','legal guardian','student') NOT NULL,
  `gen_roles` varchar(20) NOT NULL DEFAULT 'User',
  `email` varchar(150) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `contact_number` varchar(20) NOT NULL,
  `profile_pic` varchar(300) NOT NULL,
  `user_status` varchar(20) NOT NULL DEFAULT 'Active',
  `password` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_user`
--

INSERT INTO `tbl_user` (`user_id`, `fname`, `lname`, `roles`, `gen_roles`, `email`, `created_at`, `contact_number`, `profile_pic`, `user_status`, `password`) VALUES
('USR1763393878906', 'Dhenize ', 'Lopez', 'legal guardian', 'User', 'dhenizelopez@gmail.com', '2025-11-17 23:37:58', '09988262316', 'profile_pic_default.png', 'Active', '');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_user_students`
--

CREATE TABLE `tbl_user_students` (
  `userstud_id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL,
  `student_id` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_user_students`
--

INSERT INTO `tbl_user_students` (`userstud_id`, `user_id`, `student_id`) VALUES
(1, 'USR1763393878906', '20241001');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_accountant`
--
ALTER TABLE `tbl_accountant`
  ADD PRIMARY KEY (`acc_id`);

--
-- Indexes for table `tbl_acc_archv`
--
ALTER TABLE `tbl_acc_archv`
  ADD PRIMARY KEY (`arch_id`);

--
-- Indexes for table `tbl_admin`
--
ALTER TABLE `tbl_admin`
  ADD PRIMARY KEY (`admin_id`);

--
-- Indexes for table `tbl_itemlist`
--
ALTER TABLE `tbl_itemlist`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `tbl_item_images`
--
ALTER TABLE `tbl_item_images`
  ADD PRIMARY KEY (`img_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `tbl_order`
--
ALTER TABLE `tbl_order`
  ADD PRIMARY KEY (`order_id`),
  ADD UNIQUE KEY `qr_code` (`qr_code`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `tbl_order_archive`
--
ALTER TABLE `tbl_order_archive`
  ADD PRIMARY KEY (`ordrarch_id`),
  ADD KEY `confirm_id` (`confirm_id`);

--
-- Indexes for table `tbl_ordrconfirm`
--
ALTER TABLE `tbl_ordrconfirm`
  ADD PRIMARY KEY (`confirm_id`),
  ADD KEY `pay_id` (`pay_id`),
  ADD KEY `admin_id` (`admin_id`);

--
-- Indexes for table `tbl_stud`
--
ALTER TABLE `tbl_stud`
  ADD PRIMARY KEY (`student_id`);

--
-- Indexes for table `tbl_transact`
--
ALTER TABLE `tbl_transact`
  ADD PRIMARY KEY (`pay_id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `acc_id` (`acc_id`);

--
-- Indexes for table `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `tbl_user_students`
--
ALTER TABLE `tbl_user_students`
  ADD PRIMARY KEY (`userstud_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `student_id` (`student_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_item_images`
--
ALTER TABLE `tbl_item_images`
  MODIFY `img_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_user_students`
--
ALTER TABLE `tbl_user_students`
  MODIFY `userstud_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_item_images`
--
ALTER TABLE `tbl_item_images`
  ADD CONSTRAINT `tbl_item_images_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `tbl_itemlist` (`item_id`);

--
-- Constraints for table `tbl_order`
--
ALTER TABLE `tbl_order`
  ADD CONSTRAINT `tbl_order_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`user_id`),
  ADD CONSTRAINT `tbl_order_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `tbl_itemlist` (`item_id`);

--
-- Constraints for table `tbl_order_archive`
--
ALTER TABLE `tbl_order_archive`
  ADD CONSTRAINT `tbl_order_archive_ibfk_1` FOREIGN KEY (`confirm_id`) REFERENCES `tbl_ordrconfirm` (`confirm_id`);

--
-- Constraints for table `tbl_ordrconfirm`
--
ALTER TABLE `tbl_ordrconfirm`
  ADD CONSTRAINT `tbl_ordrconfirm_ibfk_1` FOREIGN KEY (`pay_id`) REFERENCES `tbl_transact` (`pay_id`),
  ADD CONSTRAINT `tbl_ordrconfirm_ibfk_2` FOREIGN KEY (`admin_id`) REFERENCES `tbl_admin` (`admin_id`);

--
-- Constraints for table `tbl_transact`
--
ALTER TABLE `tbl_transact`
  ADD CONSTRAINT `tbl_transact_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `tbl_order` (`order_id`),
  ADD CONSTRAINT `tbl_transact_ibfk_2` FOREIGN KEY (`acc_id`) REFERENCES `tbl_accountant` (`acc_id`);

--
-- Constraints for table `tbl_user_students`
--
ALTER TABLE `tbl_user_students`
  ADD CONSTRAINT `tbl_user_students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `tbl_user` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tbl_user_students_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `tbl_stud` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
