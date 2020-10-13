import { Component, OnInit, Query, ViewChild } from '@angular/core';
import { MySqlDaoService } from 'src/app/core/services/mySqlDao/my-sql-dao.service';
import { SelectionModel } from '@angular/cdk/collections';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { HttpMasterService } from 'src/app/core/services/http-master/http-master.service';
import { MasterModelService } from 'src/app/core/model/master-model/master-model.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
export interface PeriodicElement {
  sr_no: number;
  account_id: string;
  account_code: string;
  platform_id: string;
  platform: string;
  platform_name: string;
  customer_id: string;
  api_key: string;
  sushi_url: string;
  requestor_id: string;
}

@Component({
  selector: 'app-harvest',
  templateUrl: './harvest.component.html',
  styleUrls: ['./harvest.component.css']
})
export class HarvestComponent implements OnInit {

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  openTable: boolean;
  dataSource;
  selectedRow: any;
  ELEMENT_DATA = [];
  displayedColumns: string[] = ['select', 'sr_no', 'account_id', 'account_code', 'platform_id', 'platform', 'platform_name', 'customer_id', 'api_key', 'sushi_url', 'requestor_id'];
  selection = new SelectionModel<PeriodicElement>(true, []);
  result: any;
  begindate: any;
  reportData: any;

  fileName = 'harvesting.xlsx';

  constructor(
    public mySqlDao: MySqlDaoService,
    public http: HttpMasterService,
    public Model: MasterModelService,
    public utitity: UtilityService
  ) {
    this.getData();
    this.dataSource = new MatTableDataSource<PeriodicElement>(this.ELEMENT_DATA);

  }

  ngOnInit(): void { }

  async getData() {
    let query = "";
    let model = {};
    try {
      query = "SELECT @sr_no := @sr_no + 1 sr_no, `account_id`, `account_code`, `platform_id`, `platform`, `platform_name`, `customer_id`, `api_key`, `sushi_url`, `requestor_id` FROM `auth_account` INNER JOIN  `auth_account_platform` USING(`account_id`), (SELECT @sr_no := 0) m;";

      this.result = await this.mySqlDao.executeQuery(query);
      for (let i = 0; i < Object.keys(this.result.rows).length; i++) {
        model = {
          sr_no: this.result.rows[i].sr_no,
          account_id: this.result.rows[i].account_id,
          account_code: this.result.rows[i].account_code,
          platform_id: this.result.rows[i].platform_id,
          platform: this.result.rows[i].platform,
          platform_name: this.result.rows[i].platform_name,
          customer_id: this.result.rows[i].customer_id,
          api_key: this.result.rows[i].api_key,
          sushi_url: this.result.rows[i].sushi_url,
          requestor_id: this.result.rows[i].requestor_id,
        }
        this.ELEMENT_DATA.push(model);
        this.dataSource = new MatTableDataSource(this.ELEMENT_DATA);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      }

      this.openTableFun();
    } catch (error) {
      alert("getData: " + error)
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.dataSource.data.forEach(row => this.selection.select(row));
  }
  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: PeriodicElement): string {
    this.selectedRow = row;
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.sr_no + 1}`;
  }
  openTableFun = async () => {
    this.openTable = true;
  }
  closeTableFun = async () => {
    this.openTable = false;
  }
  toggleCheckbox(row) {
    this.selection.toggle(row);
    row.selected = !row.selected;
  }
  async harvesting() {
    let reports = [];
    let reportUrl = "";
    let sushiURl = "";
    let customerID = "";
    let requestorID = "";
    let platform = "";
    let apiKey = "";
    try {

      let reports = ["tr", "dr", "ir", "pr"];

      for (let row = 0; row < this.selection.selected.length; row++) {
        for (let reportNo = 0; reportNo < reports.length; reportNo++) {
          // Type Your Code Here
          sushiURl = this.selection.selected[row].sushi_url;
          customerID = this.selection.selected[row].customer_id;
          requestorID = this.selection.selected[row].requestor_id;
          platform = this.selection.selected[row].platform;
          apiKey = this.selection.selected[row].api_key;

          // Make Url For Get Reports Data
          reportUrl = sushiURl + "reports/" + reports[reportNo] + "?" +
            "customer_id=" + customerID +
            "&requestor_id=" + requestorID +
            "&platform=" + platform +
            "&api_key=" + apiKey +
            "&begin_date=" + "2020-01-01" +
            "&end_date=" + "2020-01-31" +
            "";

          console.log("URL: " + reportUrl)
          // Get Reports Data from HTTP Request
          this.reportData = await this.http.getDataByUrl(reportUrl);
          // save Data into HDD
          // this.http.saveData(this.reportData);
          
        }
      }
    } catch (error) {
      alert("harvesting: " + error)
    }
  }
  applyFilter(event: Event) {
    try {
      const filterValue = (event.target as HTMLInputElement).value;
      this.dataSource.filter = filterValue.trim().toLowerCase();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    } catch (error) {
    }
  }


  async download() {

    try {
      this.utitity.exportexcel(this.fileName);
    } catch (error) {
      console.error('downlod error');
    }
  }


}


