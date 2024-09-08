import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
} from "@mui/material";
import { Edit, Add, Search } from "@mui/icons-material";
import Navbar from "./Navbar";
import "../CssFiles/Table.css";
import axios from "axios";
import { useMsal } from "@azure/msal-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Employee = () => {
  const { accounts, instance } = useMsal();
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);

  const [newEmployee, setNewEmployee] = useState({
    empid: "",
    empdesignation: "",
    empname: "",
    empmail: "",
  });
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [employeeExists, setEmployeeExists] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [originalEmployeeId, setOriginalEmployeeId] = useState('');
  const [open, setOpen] = useState(false);

  const acquireToken = async () => {
    const request = {
      scopes: ["user.read"],
      account: accounts[0]
    };

    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error(error);
      instance.acquireTokenRedirect(request);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = await acquireToken();
      const response = await axios.get("http://localhost:8000/api/v1/asset/tabledetails", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(response.data)
      setEmployees(response.data.data.employee);
    } catch (error) {
      console.log(error);
      setEmployees([]); // Ensure employees is always an array
    }
  };

  const fetchSearchResults = async (searchTermToUse) => {
    try {
      setLoading(true);
      const token = await acquireToken();
      const response = await axios.get(`http://localhost:8000/api/v1/asset/employeesearch`, {
        params: {
          searchTerm: searchTermToUse
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEmployees(response.data.data);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchTriggered(true);
    fetchSearchResults(searchTerm);
  };

  useEffect(() => {
    if (searchTriggered) {
      fetchSearchResults(searchTerm);
    } else {
      fetchEmployees();
    }
  }, [searchTriggered]);

  const handleSearchChange = (e) => {
    const { value } = e.target;
    setSearchTerm(value);
  };
  const handleEnterKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Backspace' && searchTerm === '') {
      fetchEmployees(); // Fetch dashboard data when backspace clears search term
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
    setEditingEmployee(null);
    setNewEmployee({
      empid: "",
      empdesignation: "",
      empname: "",
      empmail: "",
    });
    setErrors({});
    setErrorMessage('');
    setEmployeeExists(false);
  };

  const handleClose = () => {
    setOpen(false);
    setErrors({});
    setErrorMessage('');
  };

  const validate = () => {
    let tempErrors = {};
    const requiredFields = ['empid', 'empdesignation', 'empname', 'empemailid'];
    requiredFields.forEach(field => {
      if (!newEmployee[field]) {
        tempErrors[field] = `${field.split(/(?=[A-Z])/).join(' ')} is required.`;
      }
    });
    setErrors(tempErrors);
    return Object.values(tempErrors).every(x => x === "");
  };

  const checkEmployeeId = async (empid) => {
    if (editingEmployee && empid === originalEmployeeId) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        empid: '',
      }));
      return;
    }

    try {
      const token = await acquireToken();
      const response = await axios.post('http://localhost:8000/api/v1/asset/checkeid', { empid }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEmployeeExists(response.data.message === true);
      if (response.data.message === true) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          empid: 'Employee ID already exists.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          empid: '',
        }));
      }
    } catch (error) {
      console.error('Error checking employee ID:', error);
    }
  };

  const handleAdd = async () => {
    if (!validate() || employeeExists) return;

    if (editingEmployee) {
      try {
        console.log("Editing Employee:", newEmployee); // Log the new employee data
        const token = await acquireToken();
        await axios.put(`http://localhost:8000/api/v1/asset/editempdetails/${newEmployee.empid}`,
          newEmployee,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        fetchEmployees(); // Refresh the employee list
        setOpen(false);
        toast.success("Employee updated successfully");
      } catch (error) {
        console.log("Error updating employee:", error);
        setErrorMessage(error.response?.data?.error || 'Failed to update employee');
      }
    } else {
      try {
        console.log("New Employee:", newEmployee); // Log the new employee data
        const token = await acquireToken();
        await axios.post("http://localhost:8000/api/v1/asset/addempdetails", newEmployee, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setEmployees([...employees, { ...newEmployee, id: employees.length + 1 }]);
        fetchEmployees();
        setOpen(false);
        toast.success("Employee added successfully");
      } catch (error) {
        console.log("Error adding employee:", error);
        setErrorMessage(error.response?.data?.error || 'Failed to add employee');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({ ...newEmployee, [name]: value });
    if (name === 'empid') {
      setEmployeeExists(false);
    }
  };

  const handleBlur = (e) => {
    const { value } = e.target;
    checkEmployeeId(value);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setOriginalEmployeeId(employee.empid);
    setNewEmployee(employee);
    setOpen(true);
    setErrors({});
    setErrorMessage('');
  };

  const filteredEmployees = employees.filter((employee) =>
    Object.values(employee).some(
      (value) =>
        value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <div className="navbar-fixed">
        <Navbar />
        
      </div>
      <ToastContainer />
      <div className="searchbar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ flexGrow: 1 }}>
            <TextField
              variant="outlined"
              placeholder="Search..."
              size="small"
              onChange={handleSearchChange}
              InputProps={{ startAdornment: <Search /> }}
              onKeyDown={handleEnterKeyPress}
              style={{ marginRight: '10px' }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
          <Button
            variant="contained"
            color="primary"
            onClick={handleClickOpen}
            startIcon={<Add />}
            style={{ marginLeft: 'auto' }}
          >
            Add New
          </Button>
        </div>
      </div>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please fill in the details of the {editingEmployee ? "employee" : "new employee"}.
          </DialogContentText>
          {errorMessage && (
            <DialogContentText color="error">
              {errorMessage}
            </DialogContentText>
          )}
          {['empid', 'empdesignation', 'empname', 'empemailid'].map((field) => (
            <TextField
              key={field}
              margin="dense"
              name={field}
              label={field.split(/(?=[A-Z])/).join(' ')}
              type="text"
              fullWidth
              value={newEmployee[field]}
              onChange={handleChange}
              onBlur={field === 'empid' ? handleBlur : null}
              error={Boolean(errors[field])}
              helperText={errors[field]}
              style={{ marginBottom: '8px' }}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAdd} color="primary">
            {editingEmployee ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <div className="table-wrapper">
        <TableContainer component={Paper} className="table-container">
          <Table className="table-containers table-fixed-header">
            <TableHead className="header-section">
              <TableRow>
                {[
                  "Employee ID",
                  "Employee Designation",
                  "Employee Name",
                  "Employee Mail",
                  "Actions",
                ].map((header) => (
                  <TableCell
                    key={header}
                    style={{ whiteSpace: "pre-line", padding: "10px" }}
                  >
                    {header.split(" ").join("\n")}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.empid}>
                  <TableCell style={{ padding: "10px" }}>
                    {employee.empid}
                  </TableCell>
                  <TableCell style={{ padding: "10px" }}>
                    {employee.empdesignation}
                  </TableCell>
                  <TableCell style={{ padding: "10px" }}>
                    {employee.empname}
                  </TableCell>
                  <TableCell style={{ padding: "10px" }}>
                    {employee.empemailid}
                  </TableCell>
                  <TableCell style={{ padding: "10px", display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </>
  );
};

export default Employee;
