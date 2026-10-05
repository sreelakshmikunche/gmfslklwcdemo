import { LightningElement, track } from 'lwc';
import getDogBreeds from '@salesforce/apex/DogBreedController.getDogBreeds';
import saveAssignedDogFact from '@salesforce/apex/DogBreedController.saveAssignedDogFact';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const COLUMNS = [
    { label: 'Breed Name', fieldName: 'name', type: 'text', initialWidth: 160 },
    { label: 'Minimum Life', fieldName: 'minLife', type: 'number', initialWidth: 130 },
    { label: 'Maximum Life', fieldName: 'maxLife', type: 'number', initialWidth: 130 },
    { label: 'Description', fieldName: 'description', type: 'text', wrapText: true },
    { label: 'Hypoallergenic', fieldName: 'hypoallergenic', type: 'boolean', initialWidth: 140 }
];

export default class DogBreedAssigner extends LightningElement {
    firstName = '';
    lastName = '';
    @track breedData = [];
    columns = COLUMNS;
    
    showTable = false;
    isLoading = false;
    selectedRow = null;

    pageNumber = 1;
    pageSize = 10;
    lastPage = 1; 
    totalRecords = 0;

    get isGetBreedsDisabled() {
        return !(this.firstName.trim() && this.lastName.trim());
    }

    get isAssignDisabled() {
        return !this.selectedRow;
    }

    get isFirstPage() {
        return this.pageNumber <= 1;
    }

    get isLastPage() {
        return this.pageNumber >= this.lastPage;
    }

    handleFirstNameChange(event) {
        this.firstName = event.target.value;
    }

    handleLastNameChange(event) {
        this.lastName = event.target.value;
    }

    handleGetBreeds() {
        this.pageNumber =1;
        this.selectedRow = null;
        this.loadPage();
    }

    loadPage(){
        this.isLoading = true;
        getDogBreeds({
            pageNumber: this.pageNumber,
            pageSize: this.pageSize
        })
            .then(result => {
                this.breedData = result.breeds;
                this.lastPage = result.lastPage;
                this.totalRecords = result.totalRecords; 
                this.showTable = true;
                this.isLoading = false;
            })
            .catch(error => {
                this.isLoading = false;
                this.showToast('Error', error.body ? error.body.message : error.message, 'error');
            });
    }

     handlePrevious() {
        if (!this.isFirstPage) {
            this.pageNumber -= 1;
            this.selectedRow = null;
            this.loadPage();
        }
    }

    handleNext() {
        if (!this.isLastPage) {
            this.pageNumber += 1;
            this.selectedRow = null;
            this.loadPage();
        }
    }

    handleRowSelection(event) {
        try{
            const selectedRows = event.detail.selectedRows;
            console.log('Selected rows: ', JSON.stringify(selectedRows));
            console.log('Length:', selectedRows.length);
            // this.selectedRow = selectedRows.length > 0 ? selectedRows[0] : null;
            if(selectedRows.length >0){
                const row = selectedRows[0];
                this.selectedRow = {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    minLife: row.minLife,
                    maxLife: row.maxLife,
                    hypoallergenic: row.hypoallergenic 
                };
            }
            else{
                this.selectedRow = null;
            }
        }
        catch (error) {
            console.error('Error in row selection:', error.message, error.stack);
        }
    }

    handleAssignFact() {
        if (!this.selectedRow) return;
        //console.log('Assigning fact for breed: ', this.selectedRow.description);
        this.isLoading = true;
        
        const cleanSelectedBreed = {
            id: String(this.selectedRow.id),
            name: String(this.selectedRow.name || ''),
            minLife: this.selectedRow.minLife ? Number(this.selectedRow.minLife) : 0,
            maxLife: this.selectedRow.maxLife ? Number(this.selectedRow.maxLife) : 0,
            description: String(this.selectedRow.description || ''),
            hypoallergenic: Boolean(this.selectedRow.hypoallergenic)
        };
        console.log('cleanSelectedBreed:', JSON.stringify(cleanSelectedBreed));

        saveAssignedDogFact({
            firstName: this.firstName,
            lastName: this.lastName,
            strSelectedBreed: JSON.stringify(cleanSelectedBreed)
        })
        .then(() => {
            this.isLoading = false;
            this.showToast(
                'Success', 
                `Assigned ${cleanSelectedBreed.name} facts to ${this.firstName} ${this.lastName}`, 
                'success'
            );
        })
        .catch(error => {
            this.isLoading = false;
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}