import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AlunosService } from '../alunos.service';
import { Aluno, Telefone } from './aluno.model';
import { ActivatedRoute } from '@angular/router';
import { NgbDatePtParserFormatter } from './../../shared/formatter/ngb-date-pt-parser-formatter';
import { AlunoErrors } from './aluno.errors';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TurmasService } from '../../turmas/turmas.service';
import { Masks } from './../../shared/formatter/masks';
import { FormValidation } from '../../shared/form-validation';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TelefoneModalComponent } from '../../telefone/telefone-modal/telefone-modal.component';
import { TurmaSearchModalComponent } from '../../turmas/turma-search-modal/turma-search-modal.component';

@Component({
  selector: 'app-aluno',
  templateUrl: './aluno.component.html',
  styleUrls: ['./aluno.component.scss']
})
export class AlunoComponent implements OnInit, OnDestroy {

  formValidation = new FormValidation();
  submitForm: FormGroup;
  fileToUpload: File;
  aluno: Aluno;
  alunoErrors: AlunoErrors;
  masks = Masks;

  $aluno: Subscription;
  loading: boolean;

  constructor(
    private alunosService: AlunosService,
    private turmasService: TurmasService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private dateFormatter: NgbDatePtParserFormatter,
    private modalService: NgbModal) { }

  ngOnInit() {
    this.loading = true;
    this.formValidation = new FormValidation();
    this.aluno = new Aluno();
    this.alunoErrors = new AlunoErrors();
    this.startForm();
    this.aluno.id = this.route.snapshot.params['id'];
    if (this.aluno.id) {
      this.formValidation.editMode = true;
      this.formValidation.alreadyNew = false;
      this.$aluno = this.alunosService.getAluno(this.aluno.id).pipe(
        finalize(() => this.loading = false)
      ).subscribe(a => {
        this.aluno = a;
        this.startForm();
      });
    } else {
      this.loading = false;
    }
  }

  ngOnDestroy() {
    if (this.$aluno) {
      this.$aluno.unsubscribe();
    }
  }

  private startForm() {
    this.submitForm = this.formBuilder.group({
      nome: [this.aluno.nome],
      dataNascimento: [this.dateFormatter.parse(this.aluno.dataNascimento)],
      matricula: [this.aluno.matricula],
      serie: [this.aluno.serie],
      turma: [this.aluno.turma],
      sala: [this.aluno.sala],
      turno: [this.aluno.turno],
      alunoBolsista: [this.aluno.alunoBolsista],
      nomeResponsavel: [this.aluno.nomeResponsavel],
      cpf: [this.aluno.cpf],
      email: [this.aluno.email],
      email2: [this.aluno.email2],
      enviarEmail: [this.aluno.enviarEmail],
      // TODO enviarMensagem
      urlFoto: [null]
    });
  }

  title(): string {
    return this.aluno.id ? 'Alterar' : 'Novo';
  }

  save() {
    this.loading = true;
    this.alunoErrors = new AlunoErrors();
    if (this.submitForm.valid) {
      const aluno = this.getAlunoFromForm();
      this.alunosService.save(aluno, this.fileToUpload).pipe(
        finalize(() => this.loading = false)
      ).subscribe(id => {
        if (Number(id)) {
          this.submitForm.value.dataNascimento = this.dateFormatter.parse(this.aluno.dataNascimento);
          if (!this.aluno.id) {
            this.formValidation.alreadyNew = true;
          }
          this.aluno.id = id;
        }
        this.formValidation.validate('Aluno salvo com sucesso!');
      }, err => {
        this.formValidation.invalidate(err.error);
        if (err.error.status === 422) {
          err.error.errors.forEach(e => {
            switch (e.fieldName) {
              case 'nome':
                this.alunoErrors.nome = e.messageString;
                break;
              case 'matricula':
                this.alunoErrors.matricula = e.messageString;
                break;
              case 'cpf':
                this.alunoErrors.cpf = e.messageString;
                break;
              case 'dataNascimento':
                this.alunoErrors.dataNascimento = e.messageString;
                break;
              case 'email':
                this.alunoErrors.email = e.messageString;
                break;
              case 'email2':
                this.alunoErrors.email2 = e.messageString;
                break;
              case 'nomeResponsavel':
                this.alunoErrors.nomeResponsavel = e.messageString;
                break;
              default:
                break;
            }
          });
        }
      });
    } else {
      this.loading = false;
    }
  }

  private getAlunoFromForm(): Aluno {
    const aluno: Aluno = this.submitForm.value;
    aluno.dataNascimento = this.dateFormatter.format(this.submitForm.value.dataNascimento);
    aluno.id = this.aluno.id;
    aluno.telefones = this.aluno.telefones;
    return aluno;
  }

  handleFileInput(files: FileList) {
    this.fileToUpload = files.item(0);
  }

  clean() {
    this.startForm();
    this.formValidation.reset();
  }

  newAluno() {
    this.aluno = new Aluno();
    this.startForm();
    this.formValidation.reset();
  }

  openAddTelefone() {
    const modalRef = this.modalService.open(TelefoneModalComponent);
    modalRef.componentInstance.aluno = this.aluno;
  }

  removeTelefone(telefone: Telefone) {
    const i = this.aluno.telefones.findIndex(x => x === telefone);
    this.aluno.telefones.splice(i, 1);
  }

  openSearchTurma() {
    const modalRef = this.modalService.open(TurmaSearchModalComponent);
    modalRef.componentInstance.submitForm = this.submitForm;
  }
}