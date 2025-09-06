import { AIResponseFormat, prepareInstructions } from '../../constants/index'
import React, { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import FileUploader from '~/components/FileUploader'
import Navbar from '~/components/Navbar'
import { convertPdfToImage } from '~/lib/pdf2img'
import { usePuterStore } from '~/lib/puter'
import { generateUUID } from '~/lib/utils'

const upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore()
    const navigate = useNavigate()
    const [isProcessing, setIsProcessing] = useState(false)
    const [statusText, setStatusText] = useState('')
    const [file, setFile] = useState<File | null>(null)

    const handleAnalyse = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File }) => {
        setIsProcessing(true)
        setStatusText('Uploading the File ...')

        const uploadedFile = await fs.upload([file])

        if (!uploadedFile) return setStatusText('Error: Failed to Upload File');

        // setStatusText('Converting to image...')
        // const imageFile = await convertPdfToImage(file)

        // if (!imageFile.file) return setStatusText('Error: Failed to convert pdf to image');

        // setStatusText('Uploading the image...')
        // const uploadedImage = await fs.upload([imageFile.file])
        // if (!uploadedImage) return setStatusText('Failed to Upload image');

        setStatusText('Preparing Data...')

        const uuid = generateUUID()
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath:'/images/resume_02.png', //to be changed later
            companyName, jobDescription, jobTitle,
            feedback: ''
        }

        await kv.set(`resume:${uuid}`, JSON.stringify(data))

        setStatusText('Analyzing...')

        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({ jobTitle, jobDescription,AIResponseFormat })
        )

        if (!feedback) return setStatusText('Error: Failed to analyse resume');

        const feedbackText = typeof feedback.message.content === 'string' ? feedback.message.content : feedback.message.content[0].text

        data.feedback = JSON.parse(feedbackText)
        await kv.set(`resume:${uuid}`, JSON.stringify(data))

        setStatusText('Analysis Complete, redirecting...')

        console.log('data', data)
        navigate(`/resume/${uuid}`)

    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget.closest('form')
        if (!form) return;
        const formData = new FormData(form)

        const companyName = formData.get('company-name') as string
        const jobTitle = formData.get('job-title') as string
        const jobDescription = formData.get('job-description') as string

        if (!file) return

        handleAnalyse({ companyName, jobTitle, jobDescription, file })
    }

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />
            <section className="main-section">
                <div className='page-heading py-16'>
                    <h1>Smart Feedback for Your Dream Job</h1>
                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>
                            <img src="/images/resume-scan.gif" alt="" className='w-full' />
                        </>
                    ) : (
                        <h2>Drop your resume for an ATS score and improvement tips.</h2>
                    )}
                    {!isProcessing && (
                        <form action="" id='upload-form' onSubmit={handleSubmit} className='flex flex-col gap-4 mt-8'>
                            <div className='form-div'>
                                <label htmlFor="company-name">Company Name</label>
                                <input type="text" name='company-name' placeholder='Google' id='company-name' />
                            </div>
                            <div className='form-div'>
                                <label htmlFor="job-title">Job Title</label>
                                <input type="text" name='job-title' placeholder='Software Engineer' id='job-title' />
                            </div>
                            <div className="form-div">
                                <label htmlFor="job-description">Job Description</label>
                                <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                            </div>
                            <div className='form-div'>
                                <label htmlFor="uploader">Upload Resume</label>
                                <FileUploader onFileSelect={handleFileSelect} />
                            </div>
                            <button className='primary-button' type='submit'>Analyze Resume</button>
                        </form>
                    )}
                </div>
            </section>
        </main>
    )
}

export default upload
