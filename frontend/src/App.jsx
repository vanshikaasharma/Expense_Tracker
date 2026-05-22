import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Overview from "./pages/Overview";
import AddExpense from "./pages/AddExpense";
import EditExpense from "./pages/EditExpense";
import Categories from "./pages/Categories";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="add" element={<AddExpense />} />
        <Route path="edit/:id" element={<EditExpense />} />
        <Route path="categories" element={<Categories />} />
      </Route>
    </Routes>
  );
}
