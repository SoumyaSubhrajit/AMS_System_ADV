import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, IconButton, MenuItem, Select
} from '@mui/material';
import { Edit, Add, Search } from '@mui/icons-material';
import Pagination from '@mui/material/Pagination';
import PaginationItem from '@mui/material/PaginationItem';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Navbar from './Navbar';
import "../CssFiles/Table.css";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useMsal } from '@azure/msal-react';
import Navbar2 from './Navbar2'



const CustomForm = () => {
  const { accounts, instance } = useMsal();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [productExists, setProductExists] = useState(false);
  const [originalProductId, setOriginalProductId] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);



  const fetchDashboardData = async (pageToFetch) => {
    try {
      setLoading(true);
      const token = await acquireToken();
      const response = await axios.get(`http://localhost:8000/api/v1/asset/paginateDashboard`, {
        params: {
          page: pageToFetch,
          limit
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchResults = async (pageToFetch, searchTermToUse) => {
    try {
      setLoading(true);
      const token = await acquireToken();
      const response = await axios.get(`http://localhost:8000/api/v1/asset/search`, {
        params: {
          page: pageToFetch,
          limit,
          searchTerm: searchTermToUse
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProducts(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = () => {
    setPage(1);
    setSearchTriggered(true);
    fetchSearchResults(1, searchTerm);
  };

  useEffect(() => {
    if (searchTriggered) {
      fetchSearchResults(page, searchTerm);
    } else {
      fetchDashboardData(page);
    }
  }, [page, searchTriggered]);


  const handleSearchChange = (e) => {
    const { value } = e.target;
    setSearchTerm(value);
  };
 
  const handleEnterKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Backspace' && searchTerm === '') {
      fetchDashboardData(1); // Fetch dashboard data when backspace clears search term
    }
  };
 
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    slno: '', productid: '', producttype: 'Laptop', productmodel: '', status: 'Active', productbrand: '',
    productserialno: '', empid: '', empname: '', empdesignation: '', empemailid: '',
    issuedate: '', returndate: ''
  });

  const handleClickOpen = () => {
    setEditingProduct(null);
    setNewProduct({
      slno: '', productid: '', producttype: 'Laptop', productmodel: '', status: 'Active', productbrand: '',
      productserialno: '', empid: '', empname: '', empdesignation: '', empemailid: '',
      issuedate: '', returndate: ''
    });
    setErrors({});
    setErrorMessage('');
    setProductExists(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const validate = () => {
    let tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    tempErrors.productid = newProduct.productid ? "" : "Product ID is required.";
    tempErrors.productmodel = newProduct.productmodel ? "" : "Product Model is required.";
    tempErrors.productbrand = newProduct.productbrand ? "" : "Product Brand is required.";
    tempErrors.productserialno = newProduct.productserialno ? "" : "Product Serial Number is required.";
    tempErrors.empid = newProduct.empid ? "" : "Employee ID is required.";
    tempErrors.empname = newProduct.empname ? "" : "Employee Name is required.";
    tempErrors.empemailid = newProduct.empemailid ? (emailRegex.test(newProduct.empemailid) ? "" : "Invalid email format.") : "Employee Email is required.";
    tempErrors.issuedate = newProduct.issuedate ? "" : "Issue Date is required.";

    setErrors(tempErrors);
    return Object.values(tempErrors).every(x => x === "");
  };

  const checkProductId = async (productid) => {
    if (editingProduct && productid === originalProductId) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        productid: '',
      }));
      return;
    }

    try {
      const token = await acquireToken();
      const response = await axios.post('http://localhost:8000/api/v1/asset/checkpid', { productid }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setProductExists(response.data.message === true);
      if (response.data.message === true) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          productid: 'Product ID already exists.',
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          productid: '',
        }));
      }
    } catch (error) {
      console.error('Error checking product ID:', error);
    }
  };

  const handleAdd = async () => {
    if (!validate() || productExists) return;

    try {
      const token = await acquireToken();
      if (editingProduct) {
        await axios.put(`http://localhost:8000/api/v1/asset/editall/${newProduct.productid}`, newProduct, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('User updated successfully.');
      } else {
        await axios.post("http://localhost:8000/api/v1/asset/assetempdetails", newProduct, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        toast.success('User added successfully.');
      }
      fetchDashboardData(page);
      setOpen(false);
      setNewProduct({
        slno: '', productid: '', producttype: 'Laptop', productmodel: '', status: 'Active', productbrand: '',
        productserialno: '', empid: '', empname: '', empdesignation: '', empemailid: '', issuedate: '', returndate: ''
      });
      setErrorMessage('');
    } catch (error) {
      console.log(error.response.data.error);
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error); // Set the error message from the response
      } else {
        setErrorMessage('Failed to add/update user.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
    if (name === 'productid') {
      setProductExists(false);
    }
  };

  const handleBlur = (e) => {
    if (e.target.name === 'productid') {
      checkProductId(e.target.value);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setOriginalProductId(product.productid); // Set the original product ID
    setNewProduct({
      ...product,
      issuedate: product.issuedate ? formatDate(product.issuedate) : '',
      returndate: product.returndate ? formatDate(product.returndate) : '',
    });
    setOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'green';
      case 'Available':
        return 'blue';
      case 'Defective':
        return 'red'
      default:
        return 'black';
    }
  };

  return (
    <>
      <div className="navbar-fixed">
      {/* <Navbar
          searchTerm={searchTerm}
          handleSearchChange={handleSearchChange}
          handleEnterKeyPress={handleEnterKeyPress}
          /> */}
      </div>
          <Navbar2/>
      <div className="searchbar-container">
        <div>
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
            onClick={handleSearch}
            sx={{ backgroundColor: '#A6E3E9' }}
          >
            Search
          </Button>
        </div>
        <Button
          variant="contained"
          
          onClick={handleClickOpen}
          startIcon={<Add />}
          sx={{ backgroundColor: '#A6E3E9',color:"#111", fontWeight:"600" }}
        >
          Add New
        </Button>
      </div>
      
      <ToastContainer />

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please fill in the details of the {editingProduct ? "product" : "new product"}.
          </DialogContentText>
          {errorMessage && (
            <DialogContentText color="error">
              {errorMessage}
            </DialogContentText>
          )}
          {['productid', 'productmodel', 'productbrand', 'productserialno', 'empid', 'empname', 'empdesignation', 'empemailid'].map((field) => (
            <TextField
              key={field}
              margin="dense"
              name={field}
              label={field.split(/(?=[A-Z])/).join(' ')}
              type="text"
              fullWidth
              value={newProduct[field]}
              onChange={handleChange}
              onBlur={handleBlur}
              error={Boolean(errors[field])}
              helperText={errors[field]}
              style={{ marginBottom: '8px' }}
            />
          ))}
          <Select
            margin="dense"
            name="producttype"
            value={newProduct.producttype}
            onChange={handleChange}
            fullWidth
            style={{ marginBottom: '8px' }}
          >
            <MenuItem value="Laptop">Laptop</MenuItem>
            <MenuItem value="Charger">Charger</MenuItem>
            <MenuItem value="Mouse">Mouse</MenuItem>
            <MenuItem value="Headset">Headphone</MenuItem>
          </Select>
          <Select
            margin="dense"
            name="status"
            value={newProduct.status}
            onChange={handleChange}
            fullWidth
            style={{ marginBottom: '8px' }}
          >
            <MenuItem value="Active">Assigned</MenuItem>
            <MenuItem value="Available">Unassigned</MenuItem>
            <MenuItem value="Defective">Defective</MenuItem>
          </Select>
          <TextField
            margin="dense"
            name="issuedate"
            label="Issue Date"
            type="date"
            fullWidth
            value={newProduct.issuedate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            error={Boolean(errors.issuedate)}
            helperText={errors.issuedate}
            style={{ marginBottom: '8px' }}
          />
          <TextField
            margin="dense"
            name="returndate"
            label="Return Date"
            type="date"
            fullWidth
            value={newProduct.returndate}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            style={{ marginBottom: '8px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAdd} color="primary">
            {editingProduct ? "Save" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <div className="table-wrapper">
        <TableContainer component={Paper} className="table-container">
          <Table className='table-containers table-fixed-header'>
            <TableHead className='header-section'>
              <TableRow>
                {['SI No.', 'Product ID', 'Product Type', 'Product Model', 'Product SerialNo', 'Product Brand', 'Employee Name', 'Employee Designation', 'Status', 'Employee ID', 'Issue Date', 'Return Date', 'Actions'].map((header) => (
                  <TableCell key={header} style={{ whiteSpace: 'pre-line', padding: '10px' }}>
                    {header.split(' ').join('\n')}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell style={{ padding: '10px' }}>{product.slno}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.productid}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.producttype}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.productmodel}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.productserialno}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.productbrand}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.empname}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.empdesignation}</TableCell>
                  <TableCell style={{ padding: '10px', color: getStatusColor(product.status) }}>{product.status}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.empid}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.issuedate}</TableCell>
                  <TableCell style={{ padding: '10px' }}>{product.returndate}</TableCell>
                  <TableCell style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton color="primary" onClick={() => handleEdit(product)}>
                        <Edit />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      <div className="pagination-fixed">
        <Pagination
          color='primary'
          count={totalPages}
          page={page}
          onChange={handlePageChange}
          renderItem={(item) => (
            <PaginationItem
              slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }}
              {...item}
            />
          )}
        />
      </div>
    </>
  );
};

export default CustomForm;
