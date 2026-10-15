import { LightningElement, track } from 'lwc';
import getDogBreeds from '@salesforce/apex/DogBreedController.getDogBreeds';
import checkDuplicateBreed from '@salesforce/apex/DogBreedController.checkDuplicateBreed';
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
    selectedBreed = '';
    isDuplicate = false;
    duplicateMessage = '';
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
        return !this.firstName || !this.lastName || !this.selectedRow ;
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

    async handleRowSelection(event) {
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
                this.selectedBreed = row.name;
            }
            else{
                this.selectedRow = null;
                this.selectedBreed ='';
            }

            await this.validateDuplicate();
        }
        catch (error) {
            console.error('Error in row selection:', error.message, error.stack);
        }
    }

    async validateDuplicate() {
        this.isDuplicate = false;
        this.duplicateMessage = '';

        if (this.firstName && this.lastName && this.selectedBreed) {
            try {
                const duplicateExists = await checkDuplicateBreed({
                    firstName: this.firstName,
                    lastName: this.lastName,
                    dogBreed: this.selectedBreed
                });

                if (duplicateExists) {
                    this.isDuplicate = true;
                    this.duplicateMessage = `${this.firstName} ${this.lastName} already has the breed '${this.selectedBreed}' assigned.`;
                }
            } catch (error) {
                console.error('Validation error:', error);
            }
        }
    }

    async handleSave() {
        // Double-check right before execution
        await this.validateDuplicate();

        if (this.isDuplicate) {
            this.showToast('Duplicate Blocked', this.duplicateMessage, 'error');
            return;
        }

        try {
            await createDogRecord({
                firstName: this.firstName,
                lastName: this.lastName,
                dogBreed: this.selectedBreed
            });

            this.showToast('Success', 'Dog breed successfully assigned!', 'success');
            this.resetForm();
        } catch (error) {
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
    }

    resetForm() {
        this.firstName = '';
        this.lastName = '';
        this.selectedBreed = '';
        this.isDuplicate = false;
        this.duplicateMessage = '';
        const datatable = this.template.querySelector('lightning-datatable');
        if (datatable) {
            datatable.selectedRows = [];
        }
    }

    async handleAssignFact() {
        if (!this.selectedRow) return;
        //console.log('Assigning fact for breed: ', this.selectedRow.description);
        
        
        const cleanSelectedBreed = {
            id: String(this.selectedRow.id),
            name: String(this.selectedRow.name || ''),
            minLife: this.selectedRow.minLife ? Number(this.selectedRow.minLife) : 0,
            maxLife: this.selectedRow.maxLife ? Number(this.selectedRow.maxLife) : 0,
            description: String(this.selectedRow.description || ''),
            hypoallergenic: Boolean(this.selectedRow.hypoallergenic)
        };
        console.log('cleanSelectedBreed:', JSON.stringify(cleanSelectedBreed));
        
        this.isLoading = true;

        try {
            // Tier 1: Check for duplicates before hitting save
            const duplicateExists = await checkDuplicateBreed({
                firstName: this.firstName,
                lastName: this.lastName,
                dogBreed: cleanSelectedBreed.name
            });

            if (duplicateExists) {
                this.isLoading = false;
                this.showToast(
                    'Duplicate Record', 
                    `${this.firstName} ${this.lastName} already has the breed '${cleanSelectedBreed.name}' assigned.`, 
                    'error'
                );
                return; // Stop execution here
            }

            // Proceed to save the record/fact if no duplicate exists
            await saveAssignedDogFact({
                firstName: this.firstName,
                lastName: this.lastName,
                strSelectedBreed: JSON.stringify(cleanSelectedBreed)
            });

            this.isLoading = false;
            this.showToast(
                'Success', 
                `Assigned ${cleanSelectedBreed.name} facts to ${this.firstName} ${this.lastName}`, 
                'success'
            );
        }
        catch (error) {
            this.isLoading = false;
            // This will also catch Tier 2 database unique constraint exceptions if they happen
            this.showToast('Error', error.body ? error.body.message : error.message, 'error');
        }
        
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}