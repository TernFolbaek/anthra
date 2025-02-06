import React from 'react';

interface Course {
    courseName: string;
    courseLink: string;
}

interface ProfilePreviewProps {
    // StepOne fields
    firstName: string;
    lastName: string;
    age: number | '';
    country: string;
    city: string;
    aboutMe: string;
    profilePictureFile: File | null;

    // StepTwo fields
    institution: string;
    faculty: string;
    courses: Course[];
    subjects: string[];
    selectedStatuses: string[];
    work: string;
}

// A small helper for placeholder elements
const Placeholder: React.FC<{ width: string; height: string; className?: string }> = ({
                                                                                          width,
                                                                                          height,
                                                                                          className = '',
                                                                                      }) => (
    <span
        className={`inline-block bg-gray-700 rounded ${className}`}
        style={{ width, height }}
    />
);

const ProfilePreview: React.FC<ProfilePreviewProps> = ({
                                                           firstName,
                                                           lastName,
                                                           age,
                                                           country,
                                                           city,
                                                           aboutMe,
                                                           profilePictureFile,
                                                           institution,
                                                           faculty,
                                                           courses,
                                                           subjects,
                                                           selectedStatuses,
                                                           work,
                                                       }) => {
    // Create a local URL for the image if available
    const previewUrl = profilePictureFile
        ? URL.createObjectURL(profilePictureFile)
        : null;

    return (
        <div className="profile-preview-container p-4 rounded-md text-gray-200">
            {/* Profile Picture and Name */}
            <p className="text-center text-gray-200 font-semibold">Profile Preview</p>
            <div className="flex items-center gap-3 mb-4">
                {previewUrl ? (
                    <img
                        src={previewUrl}
                        alt="Profile"
                        className="w-[120px] h-[120px] rounded-full object-cover"
                    />
                ) : (
                    <div className="w-[120px] h-[120px] bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm">No Image</span>
                    </div>
                )}
                <div>
                    <p className="font-medium text-2xl text-gray-300">
                        {firstName ? (
                            firstName
                        ) : (
                            <Placeholder width="80px" height="1em" />
                        )}{' '}
                        {lastName ? (
                            lastName
                        ) : (
                            <Placeholder width="80px" height="1em" />
                        )}
                    </p>
                    {age ? (
                        <p className="text-sm text-gray-400">Age: {age}</p>
                    ) : (
                        <Placeholder width="60px" height="1em" className="mt-1" />
                    )}
                    {/* Location */}
                    {(country || city) ? (
                        <p className="text-sm mb-2">
                            <strong>Location:</strong> {city}, {country}
                        </p>
                    ) : (
                        <p className="text-sm mb-2">
                            <strong>Location:</strong>{' '}
                            <Placeholder width="150px" height="1em" />
                        </p>
                    )}
                </div>
            </div>



            {/* About Me */}
            {aboutMe ? (
                <p className="mb-4 flex flex-col">
                    <strong>About Me:</strong> <p className="text-gray-400">{aboutMe}</p>
                </p>
            ) : (
                <p className="mb-4 flex flex-col">
                    <strong>About Me:</strong>{' '}
                    <Placeholder width="100%" height="5em" />
                </p>
            )}

            {/* Step Two Fields */}
            {institution ? (
                <p className="mb-2 flex items-center gap-2">
                    <strong>Institution:</strong> <p className="text-gray-400">{institution}</p>
                </p>
            ) : (
                <p className="mb-2">
                    <strong>Institution:</strong>{' '}
                    <Placeholder width="150px" height="1em" />
                </p>
            )}

            {faculty ? (
                <p className="mb-2 flex items-center gap-2">
                    <strong>Faculty:</strong> <p className="text-gray-400">{faculty}</p>
                </p>
            ) : (
                <></>
            )}

            {/* Courses */}
            <div className="mb-2">
                <strong>Courses (expertise):</strong>
                {courses && courses.length > 0 ? (
                    <ul className="list-disc ml-5">
                        {courses.map((c, i) => (
                            <li key={i}>
                                {c.courseLink ? (
                                    <a
                                        href={
                                            c.courseLink.startsWith('http')
                                                ? c.courseLink
                                                : `https://${c.courseLink}`
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-emerald-300 underline ml-1"
                                    >
                                        {c.courseName}
                                    </a>
                                ) : (
                                    c.courseName
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <ul className="list-disc ml-5">
                        <li>
                            <Placeholder width="100px" height="1em" />
                        </li>
                    </ul>
                )}
            </div>

            {/* Subjects */}
            <div className="mb-2">
                <strong>Topics of Interest:</strong>
                {subjects && subjects.length > 0 ? (
                    <ul className="list-disc ml-5">
                        {subjects.map((subj, idx) => (
                            <li className="text-gray-400" key={idx}>{subj}</li>
                        ))}
                    </ul>
                ) : (
                    <ul className="list-disc ml-5">
                        <li>
                            <Placeholder width="75%" height="1em"/>
                        </li>
                        <li>
                            <Placeholder width="60%" height="1em"/>
                        </li>
                    </ul>
                )}
            </div>

            {/* Work */}
            {work ? (
                <p className="mb-2 flex items-center gap-2">
                    <strong>Job Title:</strong> <p className="text-gray-400">{work}</p>
                </p>
            ) : (
                <p className="mb-2">
                    <strong>Job Title:</strong>{' '}
                    <Placeholder width="120px" height="1em" />
                </p>
            )}

            {/* Selected Statuses */}
            <div className="mb-2">
                <strong>Status:</strong>
                {selectedStatuses && selectedStatuses.length > 0 ? (
                    <ul className="list-disc ml-5">
                        {selectedStatuses.map((s, idx) => (
                            <li className="text-gray-400" key={idx}>{s}</li>
                        ))}
                    </ul>
                ) : (
                    <ul className="list-disc ml-5">
                        <li>
                            <Placeholder width="100%" height="1em"/>
                        </li>
                        <li>
                            <Placeholder width="80%" height="1em"/>
                        </li>
                        <li>
                            <Placeholder width="60%" height="1em"/>
                        </li>
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ProfilePreview;
