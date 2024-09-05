import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from '../root.scss';
import { OpenmrsDatePicker, ResponsiveWrapper, closeWorkspace } from '@openmrs/esm-framework';
import { Form } from '@carbon/react';
import { Controller, useForm } from 'react-hook-form';
import { Select, SelectItem, Toggle, Stack } from '@carbon/react';
import { TextArea } from '@carbon/react';
import { DatePicker } from '@carbon/react';
import { DatePickerInput } from '@carbon/react';
import { Text } from '@carbon/react/lib/components/Text';
import { TextInput } from '@carbon/react';
import { ButtonSet } from '@carbon/react';
import { Button } from '@carbon/react';
import { fetchLocation, getPatientInfo, saveEncounter } from '../api/api';
import { TRANSFEROUT_ENCOUNTER_TYPE_UUID, TRANSFEROUT_FORM_UUID } from '../constants';

type FormInputs = {
  transferredFrom: string;
  transferredTo: string;
  name: string;
  mrn: string;
  artStarted: string;
  originalFirstLineRegimenDose: string;
  dateOfTransfer: Date;
};

interface TransferOutFormProps {
  patientUuid: string;
}

const TransferOutForm: React.FC = ({ patientUuid }: TransferOutFormProps) => {
  const { t } = useTranslation();
  const onError = (error) => console.error(error);
  const { control, handleSubmit, setValue } = useForm<FormInputs>();
  const [facilityLocationUUID, setFacilityLocationUUID] = useState('');
  const [facilityLocationName, setFacilityLocationName] = useState('');

  // const encounterDatetime = '2024-07-24T11:57:37.991Z';
  console.log(new Date(new Date().toString().split('GMT')[0] + ' UTC').toISOString());

  const encounterDatetime = new Date(new Date().toString().split('GMT')[0] + ' UTC').toISOString();
  const encounterProviders = [
    { provider: 'caa66686-bde7-4341-a330-91b7ad0ade07', encounterRole: 'a0b03050-c99b-11e0-9572-0800200c9a66' },
  ];
  const encounterType = TRANSFEROUT_ENCOUNTER_TYPE_UUID;
  const form = { uuid: TRANSFEROUT_FORM_UUID };
  const location = facilityLocationUUID;
  const patient = patientUuid;
  const orders = [];

  const [pickedDate, setPickedDate] = useState<Date | null>(null); // Added state for pickedDate

  useEffect(() => {
    (async function () {
      const facilityInformation = await fetchLocation();
      facilityInformation.data.results.forEach((element) => {
        if (element.tags.some((x) => x.display === 'Facility Location')) {
          setFacilityLocationUUID(element.uuid);
          setFacilityLocationName(element.display);
        }
      });
    })();
  }, []);

  useEffect(() => {
    (async function () {
      const patientInfo = await getPatientInfo(patientUuid);
      const { givenName, middleName, familyName } = patientInfo.person?.preferredName;
      const mrn = patientInfo?.identifiers?.find((e) => e.identifierType?.display === 'MRN')?.identifier;
      setValue('name', `${givenName} ${middleName} ${familyName}`);
      setValue('mrn', mrn);
    })();
  }, []);

  const conceptObject = {
    transfferedFrom: '161550AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    transferredTo: '2c30c599-1e4f-46f9-8488-5ab57cdc8ac3',
    name: '1593AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    mrn: '9f760fe1-5cde-41ab-99b8-b8e1d77de902',
    artStarted: '1149AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    originalFirstLineRegimenDose: '6d7d0327-e1f8-4246-bfe5-be1e82d94b14',
    dateOfTransfer: '160649AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  };

  const formatValue = (value) => {
    return value instanceof Object
      ? new Date(value.startDate.getTime() - value.startDate?.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      : value;
  };

  const handleFormSubmit = async (fieldValues: FormInputs) => {
    const obs = [];
    Object.keys(fieldValues).forEach((key) => {
      if (fieldValues[key]) {
        obs.push({
          concept: conceptObject[key],
          formFieldNamespace: 'rfe-forms',
          formFieldPath: `rfe-forms-${key}`,
          value: formatValue(fieldValues[key]),
        });
      }
    });

    const payload = {
      encounterDatetime,
      encounterProviders,
      encounterType,
      form,
      location,
      patient,
      orders,
      obs: obs,
    };

    await saveEncounter(new AbortController(), payload);
    return true;
  };

  return (
    <div className={styles.container}>
      <Form onSubmit={handleSubmit(handleFormSubmit, onError)}>
        <Stack gap={4}>
          <section className={styles.formGroup}>
            <ResponsiveWrapper>
              <TextInput
                id="transferredFrom"
                value={facilityLocationName}
                labelText="Transferred From"
                placeholder="Facility Name"
                helperText="Helper text"
              />
            </ResponsiveWrapper>
          </section>

          <section className={styles.formGroup}>
            <ResponsiveWrapper>
              <Controller
                name="transferredTo"
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextInput
                    id="transferredTo"
                    value={value}
                    labelText="Transferred To"
                    placeholder="Facility Name"
                    onChange={onChange}
                    onBlur={onBlur}
                    helperText="Helper text"
                    ref={ref}
                  />
                )}
              />
            </ResponsiveWrapper>
          </section>

          <section className={styles.formGroup}>
            <ResponsiveWrapper>
              <Controller
                name="dateOfTransfer"
                control={control}
                render={({ field: { onChange, value, ref } }) => (
                  // <OpenmrsDatePicker
                  //   id="datePickerInput"
                  //   onChange={onChange}
                  //   labelText="Date of Transfer"
                  //   // isDisabled={question.isDisabled}
                  //   // isReadOnly={isTrue(question.readonly)}
                  //   // isRequired={question.isRequired ?? false}
                  //   // isInvalid={errors.length > 0}
                  //   // invalidText={errors[0]?.message}
                  //   // value={field.value}
                  // />

                  <DatePicker
                    datePickerType="single"
                    //   dateFormat={datePickerFormat}
                    // value={pickedDate || value.startDate}
                    onChange={([date]) => {
                      if (date) {
                        onChange({ ...value, startDate: date });
                      }
                    }}
                    //   minDate={minAllowedDate} // Set the minimum allowed date
                  >
                    <DatePickerInput
                      id="datePickerInput"
                      labelText="Date of Transfer"
                      style={{ width: '100%' }}
                      // placeholder={datePickerPlaceHolder}
                      ref={ref}
                    />
                  </DatePicker>
                )}
              />
            </ResponsiveWrapper>
          </section>

          <section className={styles.formGroup}>
            <ResponsiveWrapper>
              <Controller
                name="name"
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextInput
                    id="name"
                    value={value}
                    labelText="Name"
                    placeholder="Patient Name"
                    onBlur={onBlur}
                    ref={ref}
                  />
                )}
              />
            </ResponsiveWrapper>
          </section>

          <section className={styles.formGroup}>
            <ResponsiveWrapper>
              <Controller
                name="mrn"
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextInput id="mrn" value={value} labelText="MRN" placeholder="MRN" onBlur={onBlur} ref={ref} />
                )}
              />
            </ResponsiveWrapper>
          </section>

          <section className={styles.formGroup}>
            <ResponsiveWrapper>
              <Controller
                name="artStarted"
                control={control}
                render={({ field: { onChange, value, onBlur, ref } }) => (
                  <Select
                    id="artStarted"
                    invalidText="Required"
                    labelText="ART Started"
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    ref={ref}
                  >
                    <SelectItem key={1} text={''} value={''}></SelectItem>
                    <SelectItem key={1} text={'Yes'} value={'1065AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'}>
                      Yes
                    </SelectItem>
                    <SelectItem key={2} text={'No'} value={'1066AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'}>
                      No
                    </SelectItem>
                  </Select>
                )}
              />
            </ResponsiveWrapper>
          </section>

          <section className={styles.formGroup}>
            <ResponsiveWrapper>
              <Controller
                name="originalFirstLineRegimenDose"
                control={control}
                render={({ field: { onChange, value, onBlur, ref } }) => (
                  <Select
                    id="originalFirstLineRegimenDose"
                    invalidText="Required"
                    labelText="Original First Line Regimen Dose"
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value}
                    ref={ref}
                  >
                    <SelectItem key={1} text={''} value={''}></SelectItem>
                    <SelectItem key={1} text={'1a30 - D4T(30)+3TC+NVP'} value={'2798d3bc-2e0a-459c-b249-9516b380a69e'}>
                      1a30 - D4T(30)+3TC+NVP
                    </SelectItem>
                    <SelectItem key={2} text={'1a40 - D4T(40)+3TC+NVP'} value={'3495d89f-4d46-44d8-b1c9-d101bc9f15d4'}>
                      1a40 - D4T(40)+3TC+NVP
                    </SelectItem>
                    <SelectItem key={1} text={'1b30 - D4T(30)+3TC+EFV'} value={'ae0dc59c-eb3d-421b-913b-ee5a06ec6182'}>
                      1b30 - D4T(30)+3TC+EFV
                    </SelectItem>
                  </Select>
                )}
              />
            </ResponsiveWrapper>
          </section>

          {/* <section className={styles.formGroup}>
            <span className={styles.heading}>{t('note', 'Note')}</span>
            <ResponsiveWrapper>
              <Controller
                name="appointmentNote"
                control={control}
                render={({ field: { onChange, onBlur, value, ref } }) => (
                  <TextArea
                    id="appointmentNote"
                    value={value}
                    labelText={t('appointmentNoteLabel', 'Write an additional note')}
                    placeholder={t('appointmentNotePlaceholder', 'Write any additional points here')}
                    onChange={onChange}
                    onBlur={onBlur}
                    ref={ref}
                  />
                )}
              />
            </ResponsiveWrapper>
          </section> */}
        </Stack>

        <ButtonSet style={{ marginTop: '20px' }}>
          <Button className={styles.button} onClick={closeWorkspace} kind="secondary">
            {t('discard', 'Discard')}
          </Button>
          <Button className={styles.button} type="submit">
            {t('saveAndClose', 'Save and close')}
          </Button>
        </ButtonSet>
      </Form>
    </div>
  );
};

export default TransferOutForm;
